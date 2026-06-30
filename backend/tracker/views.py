from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token

from .models import Bus, BusLocation
from .serializers import BusSerializer, BusLocationSerializer, LocationUpdateSerializer


class DriverLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'error': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = authenticate(username=user.username, password=password)
        if not user:
            return Response(
                {'error': 'Invalid credentials.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            profile = user.driver_profile
        except AttributeError:
            return Response(
                {'error': 'This account is not registered as a driver.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)

        bus_data = None
        if profile.assigned_bus:
            bus_data = {
                'id': profile.assigned_bus.id,
                'name': profile.assigned_bus.name,
                'route': profile.assigned_bus.route,
            }

        return Response({
            'token': token.key,
            'driver_name': user.get_full_name() or user.email,
            'bus': bus_data,
        })


class TripStartView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            bus = request.user.driver_profile.assigned_bus
        except AttributeError:
            return Response(
                {'error': 'No driver profile or bus assigned.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not bus:
            return Response(
                {'error': 'No bus assigned to your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bus.is_active = True
        bus.save(update_fields=['is_active'])
        return Response({'status': 'trip started', 'bus_id': bus.id})


class TripEndView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            bus = request.user.driver_profile.assigned_bus
        except AttributeError:
            return Response(
                {'error': 'No driver profile or bus assigned.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not bus:
            return Response(
                {'error': 'No bus assigned to your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        bus.is_active = False
        bus.save(update_fields=['is_active'])
        return Response({'status': 'trip ended', 'bus_id': bus.id})


class LocationUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            bus = request.user.driver_profile.assigned_bus
        except AttributeError:
            return Response(
                {'error': 'No driver profile or bus assigned.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        if not bus:
            return Response(
                {'error': 'No bus assigned to your account.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = LocationUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        BusLocation.objects.update_or_create(
            bus=bus,
            defaults={
                'latitude': serializer.validated_data['latitude'],
                'longitude': serializer.validated_data['longitude'],
            },
        )

        return Response({'status': 'ok'})


class BusListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        buses = Bus.objects.select_related('driver__user', 'location').all()
        serializer = BusSerializer(buses, many=True)
        return Response(serializer.data)


class BusLocationView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        try:
            bus = Bus.objects.get(pk=pk)
        except Bus.DoesNotExist:
            return Response({'error': 'Bus not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            location = bus.location
        except BusLocation.DoesNotExist:
            return Response(
                {'error': 'No location data available for this bus.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BusLocationSerializer(location)
        return Response(serializer.data)

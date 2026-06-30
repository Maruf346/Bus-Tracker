from rest_framework import serializers
from .models import Bus, BusLocation


class BusLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusLocation
        fields = ['latitude', 'longitude', 'updated_at']


class BusSerializer(serializers.ModelSerializer):
    driver_name = serializers.SerializerMethodField()
    last_seen = serializers.SerializerMethodField()

    class Meta:
        model = Bus
        fields = ['id', 'name', 'route', 'is_active', 'driver_name', 'last_seen']

    def get_driver_name(self, obj):
        try:
            return obj.driver.user.get_full_name() or obj.driver.user.email
        except AttributeError:
            return None

    def get_last_seen(self, obj):
        try:
            return obj.location.updated_at
        except AttributeError:
            return None


class LocationUpdateSerializer(serializers.Serializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)

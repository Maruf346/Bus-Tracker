from django.urls import path
from . import views

urlpatterns = [
    path('auth/driver-login/', views.DriverLoginView.as_view(), name='driver-login'),
    path('trip/start/', views.TripStartView.as_view(), name='trip-start'),
    path('trip/end/', views.TripEndView.as_view(), name='trip-end'),
    path('location/update/', views.LocationUpdateView.as_view(), name='location-update'),
    path('buses/', views.BusListView.as_view(), name='bus-list'),
    path('buses/<int:pk>/location/', views.BusLocationView.as_view(), name='bus-location'),
]

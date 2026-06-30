from django.db import models
from django.contrib.auth.models import User


class Bus(models.Model):
    name = models.CharField(max_length=100)
    route = models.CharField(max_length=200)
    is_active = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'Buses'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} — {self.route}'


class DriverProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='driver_profile')
    assigned_bus = models.OneToOneField(
        Bus, on_delete=models.SET_NULL, null=True, blank=True, related_name='driver'
    )
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f'{self.user.get_full_name() or self.user.email} → {self.assigned_bus}'


class BusLocation(models.Model):
    bus = models.OneToOneField(Bus, on_delete=models.CASCADE, related_name='location')
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.bus.name} @ ({self.latitude:.4f}, {self.longitude:.4f})'

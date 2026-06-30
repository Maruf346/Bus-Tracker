from django.contrib import admin
from .models import Bus, DriverProfile, BusLocation


@admin.register(Bus)
class BusAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'route')
    list_editable = ('is_active',)
    ordering = ('name',)


@admin.register(DriverProfile)
class DriverProfileAdmin(admin.ModelAdmin):
    list_display = ('get_email', 'get_full_name', 'assigned_bus', 'phone')
    search_fields = ('user__email', 'user__first_name', 'user__last_name')
    autocomplete_fields = ('assigned_bus',)

    @admin.display(description='Email', ordering='user__email')
    def get_email(self, obj):
        return obj.user.email

    @admin.display(description='Name', ordering='user__first_name')
    def get_full_name(self, obj):
        return obj.user.get_full_name() or '—'


@admin.register(BusLocation)
class BusLocationAdmin(admin.ModelAdmin):
    list_display = ('bus', 'latitude', 'longitude', 'updated_at')
    readonly_fields = ('updated_at',)
    ordering = ('-updated_at',)

from django.urls import path
from app import views

urlpatterns = [
    path("", views.index_view, name="index"),
    path("dashboard", views.dashboard_view, name="dashboard"),
    path("vote/<int:user_id>", views.vote_view, name="vote"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register_view, name="register"),
    path("account/<str:username>", views.account_view, name="account"),
    path("account", views.login_view),
    path("api/status", views.status_api_view)
]
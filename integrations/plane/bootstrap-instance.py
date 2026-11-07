# Executado DENTRO do container plane-api-1 via `docker exec`.
# Configura a instância do Plane do laboratório de forma idempotente:
#  - usuário admin (discovery@medagenda.local)
#  - InstanceAdmin + is_setup_done
#  - workspace "medagenda"
#  - API token (impresso no stdout como PLANE_API_KEY=...)
import os

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "plane.settings.production")
django.setup()

from django.contrib.auth.hashers import make_password  # noqa: E402
from django.utils import timezone  # noqa: E402

from plane.db.models import APIToken, Profile, User, Workspace, WorkspaceMember  # noqa: E402
from plane.license.models import Instance, InstanceAdmin  # noqa: E402

EMAIL = os.environ.get("LAB_PLANE_EMAIL", "discovery@medagenda.local")
PASSWORD = os.environ.get("LAB_PLANE_PASSWORD", "DiscoveryLab2026!")
WORKSPACE_SLUG = os.environ.get("LAB_PLANE_WORKSPACE", "medagenda")

instance = Instance.objects.first()
assert instance is not None, "Instância não existe — rode as migrations primeiro"

user = User.objects.filter(email=EMAIL).first()
if user is None:
    import uuid

    user = User.objects.create(
        email=EMAIL,
        username=uuid.uuid4().hex,
        password=make_password(PASSWORD),
        first_name="Discovery",
        last_name="Lab",
        is_password_autoset=False,
        is_active=True,
        last_active=timezone.now(),
    )
    Profile.objects.create(user=user, company_name="MedAgenda")
    print("usuario: criado")
else:
    # garante a senha conhecida do laboratório
    user.password = make_password(PASSWORD)
    user.is_active = True
    user.save()
    Profile.objects.get_or_create(user=user, defaults={"company_name": "MedAgenda"})
    print("usuario: ja existia (senha garantida)")

if not InstanceAdmin.objects.filter(user=user).exists():
    InstanceAdmin.objects.create(user=user, instance=instance, role=20)
    print("instance admin: criado")
else:
    print("instance admin: ja existia")

instance.is_setup_done = True
instance.is_signup_screen_visited = True
instance.instance_name = "MedAgenda Lab"
instance.is_telemetry_enabled = False
instance.save()
print("instancia: configurada")

workspace = Workspace.objects.filter(slug=WORKSPACE_SLUG).first()
if workspace is None:
    workspace = Workspace.objects.create(
        name="MedAgenda",
        slug=WORKSPACE_SLUG,
        owner=user,
        organization_size="2-10",
    )
    print("workspace: criado")
else:
    print("workspace: ja existia")

if not WorkspaceMember.objects.filter(workspace=workspace, member=user).exists():
    WorkspaceMember.objects.create(workspace=workspace, member=user, role=20)
    print("workspace member: criado")

token_obj = APIToken.objects.filter(user=user, label="discovery-lab").first()
if token_obj is None:
    token_obj = APIToken.objects.create(
        user=user,
        label="discovery-lab",
        description="Token do CTO Discovery Lab",
        user_type=0,
    )
    print("api token: criado")
else:
    print("api token: ja existia")

print(f"PLANE_API_KEY={token_obj.token}")
print(f"PLANE_WORKSPACE_SLUG={WORKSPACE_SLUG}")
print(f"PLANE_LOGIN={EMAIL} / {PASSWORD}")

"""Initial migration

Revision ID: e4ba0238d698
Revises: None
Create Date: 2025-02-28 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e4ba0238d698'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Esta migração inicial não faz nada específico
    pass


def downgrade() -> None:
    # Método de downgrade vazio
    pass
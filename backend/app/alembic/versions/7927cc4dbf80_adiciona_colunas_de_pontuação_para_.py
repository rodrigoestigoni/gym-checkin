"""Adiciona colunas de pontuação para desafios
Revision ID: 7927cc4dbf80
Revises: e4ba0238d698
Create Date: 2025-02-13 00:42:44.820933
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '7927cc4dbf80'
down_revision: Union[str, None] = 'e4ba0238d698'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Usar SQLAlchemy para verificar se a coluna já existe
    inspector = sa.inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('challenge_participants')]
    
    # Adicionar coluna apenas se não existir
    if 'challenge_points' not in columns:
        op.add_column('challenge_participants', sa.Column('challenge_points', sa.Integer(), nullable=True))

def downgrade() -> None:
    # Verificar se a coluna existe antes de tentar dropar
    inspector = sa.inspect(op.get_bind())
    columns = [col['name'] for col in inspector.get_columns('challenge_participants')]
    
    if 'challenge_points' in columns:
        op.drop_column('challenge_participants', 'challenge_points')
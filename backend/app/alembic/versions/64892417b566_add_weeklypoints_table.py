"""Add WeeklyPoints table
Revision ID: 64892417b566
Revises: 7927cc4dbf80
Create Date: 2025-02-19 23:37:52.727484
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '64892417b566'
down_revision: Union[str, None] = '7927cc4dbf80'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Verificar se a tabela já existe
    inspector = sa.inspect(op.get_bind())
    
    # Só cria a tabela se ela não existir
    if not inspector.has_table('weekly_points'):
        op.create_table('weekly_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('week_start', sa.DateTime(), nullable=False),
        sa.Column('week_end', sa.DateTime(), nullable=False),
        sa.Column('checkin_count', sa.Integer(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
        )
        op.create_index(op.f('ix_weekly_points_id'), 'weekly_points', ['id'], unique=False)

def downgrade() -> None:
    # Verificar se a tabela existe antes de tentar dropar
    inspector = sa.inspect(op.get_bind())
    
    if inspector.has_table('weekly_points'):
        op.drop_index(op.f('ix_weekly_points_id'), table_name='weekly_points')
        op.drop_table('weekly_points')
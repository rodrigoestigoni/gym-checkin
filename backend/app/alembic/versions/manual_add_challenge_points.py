"""Add challenge_points table manually

Revision ID: manual_add_challenge_points
Revises: 64892417b566
Create Date: 2025-02-28 23:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'manual_add_challenge_points'
down_revision: Union[str, None] = '64892417b566'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Cria a tabela challenge_points
    op.create_table('challenge_points',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('challenge_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.DateTime(), nullable=False),
        sa.Column('period_end', sa.DateTime(), nullable=False),
        sa.Column('checkin_count', sa.Integer(), nullable=True),
        sa.Column('points', sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(['challenge_id'], ['challenges.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Cria um índice composto
    op.create_index('idx_challenge_points_user_period', 'challenge_points', 
                   ['challenge_id', 'user_id', 'period_start'], unique=False)
    
    # Cria um índice simples
    op.create_index(op.f('ix_challenge_points_id'), 'challenge_points', ['id'], unique=False)


def downgrade() -> None:
    # Remove os índices e a tabela
    op.drop_index(op.f('ix_challenge_points_id'), table_name='challenge_points')
    op.drop_index('idx_challenge_points_user_period', table_name='challenge_points')
    op.drop_table('challenge_points')

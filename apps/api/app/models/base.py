import datetime
from sqlalchemy.orm import declarative_base, declared_attr, Mapped, mapped_column
from sqlalchemy import DateTime, func, Boolean

Base = declarative_base()


class BaseModelMixin:
    @declared_attr
    def __tablename__(cls):
        return cls.__name__

    id: Mapped[int] = mapped_column(primary_key=True)
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    deleted_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )
    last_modified: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

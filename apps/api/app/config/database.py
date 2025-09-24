from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# from app.utils.soft_delete import DBSession, SoftDeleteQuery

from .env import settings

engine = create_engine(settings.DATABASE_URL)

# SessionLocal = sessionmaker(
#     autocommit=False,
#     autoflush=False,
#     bind=engine,
#     # query_cls=SoftDeleteQuery,
#     # class_=DBSession,
# )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

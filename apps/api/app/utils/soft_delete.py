from datetime import datetime
from sqlalchemy.orm import Query, Session


class SoftDeleteQuery(Query):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._with_deleted = False

    def with_deleted(self):
        self._with_deleted = True
        return self

    def get(self, ident):
        if self._with_deleted:
            return super().get(ident)
        return super().filter_by(is_deleted=False).get(ident)

    def __iter__(self):
        if self._with_deleted:
            return super().__iter__()
        return super().filter_by(is_deleted=False).__iter__()


class DBSession(Session):
    def delete(self, instance):
        """
        Override delete method to perform a soft delete.
        """
        if hasattr(instance, "is_deleted"):
            instance.is_deleted = True
            if hasattr(instance, "deleted_at"):
                instance.deleted_at = datetime.now()
            self.add(instance)
            self.flush()
        else:
            super().delete(instance)

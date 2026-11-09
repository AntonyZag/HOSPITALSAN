class AppError(Exception):
    """Error de aplicación con un mensaje seguro para el cliente."""

    status_code = 500

    def __init__(self, detail: str) -> None:
        super().__init__(detail)
        self.detail = detail


class NotFoundError(AppError):
    status_code = 404


class ConflictError(AppError):
    status_code = 409


class BusinessRuleError(AppError):
    status_code = 422


class DatabaseUnavailableError(AppError):
    status_code = 503


class DatabaseError(AppError):
    status_code = 500

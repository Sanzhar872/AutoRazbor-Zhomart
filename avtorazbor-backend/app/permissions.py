from functools import wraps
from typing import Callable, Any
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app.errors import UnauthorizedError, ForbiddenError


def require_auth(fn: Callable) -> Callable:
    @wraps(fn)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        verify_jwt_in_request()
        return fn(*args, **kwargs)
    return wrapper


def require_role(*roles: str) -> Callable:
    def decorator(fn: Callable) -> Callable:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get("role") not in roles:
                raise ForbiddenError("Недостаточно прав")
            return fn(*args, **kwargs)
        return wrapper
    return decorator

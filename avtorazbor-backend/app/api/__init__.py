from flask import Flask


def register_blueprints(app: Flask) -> None:
    from app.api.health import bp as health_bp
    from app.api.auth import bp as auth_bp
    from app.api.parts import bp as parts_bp
    from app.api.cars import bp as cars_bp
    from app.api.categories import bp as categories_bp
    from app.api.favorites import bp as favorites_bp
    from app.api.config_endpoint import bp as config_bp
    from app.api.media import bp as media_bp
    from app.api.admin.stock import bp as stock_bp
    from app.api.admin.dashboard import bp as dashboard_bp
    from app.api.admin.sales import bp as sales_bp

    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(parts_bp)
    app.register_blueprint(cars_bp)
    app.register_blueprint(categories_bp)
    app.register_blueprint(favorites_bp)
    app.register_blueprint(config_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(stock_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(sales_bp)

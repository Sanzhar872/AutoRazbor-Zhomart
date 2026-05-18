def get_favorite_slots(stock: int) -> int:
    if stock == 0:
        return 0
    elif stock < 5:
        return 3
    elif stock < 10:
        return 4
    elif stock < 20:
        return 5
    else:
        return 7

from app.utils.favorite_slots import get_favorite_slots


def test_stock_zero():
    assert get_favorite_slots(0) == 0


def test_stock_1_to_4():
    assert get_favorite_slots(1) == 3
    assert get_favorite_slots(4) == 3


def test_stock_5_to_9():
    assert get_favorite_slots(5) == 4
    assert get_favorite_slots(9) == 4


def test_stock_10_to_19():
    assert get_favorite_slots(10) == 5
    assert get_favorite_slots(19) == 5


def test_stock_20_plus():
    assert get_favorite_slots(20) == 7
    assert get_favorite_slots(100) == 7

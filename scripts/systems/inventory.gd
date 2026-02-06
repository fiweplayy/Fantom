extends Node
class_name Inventory

# Simple inventory with limited slots.

const MAX_SLOTS := 30

var slots := []

func _init() -> void:
    slots.resize(MAX_SLOTS)

func add_item(item_id: int, amount: int = 1) -> bool:
    for i in range(MAX_SLOTS):
        if slots[i] == null:
            slots[i] = {"id": item_id, "amount": amount}
            return true
    return false

func remove_item(item_id: int, amount: int = 1) -> bool:
    for i in range(MAX_SLOTS):
        if slots[i] and slots[i]["id"] == item_id:
            slots[i]["amount"] -= amount
            if slots[i]["amount"] <= 0:
                slots[i] = null
            return true
    return false

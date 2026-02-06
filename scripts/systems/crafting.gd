extends Node
class_name CraftingSystem

# Crafting recipes: inputs -> outputs.

var recipes := {
    "planks": {
        "inputs": {5: 1},
        "output": {"id": 9, "amount": 4}
    },
    "stick": {
        "inputs": {9: 2},
        "output": {"id": 10, "amount": 4}
    }
}

func can_craft(inventory: Inventory, recipe_key: String) -> bool:
    if not recipes.has(recipe_key):
        return false
    var recipe = recipes[recipe_key]
    for item_id in recipe["inputs"].keys():
        if _count_item(inventory, item_id) < recipe["inputs"][item_id]:
            return false
    return true

func craft(inventory: Inventory, recipe_key: String) -> bool:
    if not can_craft(inventory, recipe_key):
        return false
    var recipe = recipes[recipe_key]
    for item_id in recipe["inputs"].keys():
        inventory.remove_item(item_id, recipe["inputs"][item_id])
    inventory.add_item(recipe["output"]["id"], recipe["output"]["amount"])
    return true

func _count_item(inventory: Inventory, item_id: int) -> int:
    var total := 0
    for slot in inventory.slots:
        if slot and slot["id"] == item_id:
            total += slot["amount"]
    return total

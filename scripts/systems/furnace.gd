extends Node
class_name Furnace

# Simple smelting system with placeholder timers.

var fuel_time := 0.0
var smelt_time := 0.0

var input_slot := null
var fuel_slot := null
var output_slot := null

var recipes := {
    8: {"output": 11, "time": 8.0} # iron_ore -> iron_ingot
}

func _process(delta: float) -> void:
    if fuel_time > 0 and input_slot:
        fuel_time -= delta
        smelt_time += delta
        var recipe = recipes.get(input_slot["id"], null)
        if recipe and smelt_time >= recipe["time"]:
            output_slot = {"id": recipe["output"], "amount": 1}
            input_slot = null
            smelt_time = 0.0
    elif fuel_slot:
        fuel_time = 10.0
        fuel_slot = null

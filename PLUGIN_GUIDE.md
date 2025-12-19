
# Modpack Architect Plugin Guide

Plugins are JavaScript files (`.js`) that allow you to register custom machines and define script processors. Processors are mapped to specific machines via `machineId`.

## Plugin Structure

A plugin must return a JavaScript object. Each processor defined in `processors` should have a `machineId` that matches the machine it is intended to handle.

```javascript
return {
  id: "kubejs-integration",
  name: "KubeJS Exporter",
  description: "Exports all recipes to KubeJS scripts.",
  version: "1.0.0",
  // Machines registered by this plugin
  machines: [
    {
      id: "industrial_grinder",
      name: "Industrial Grinder",
      description: "Grinds stuff into dust.",
      inputs: [{ type: "item", label: "Input" }],
      outputs: [{ type: "item", label: "Result" }]
    }
  ],
  // Export processors - mapped by machineId
  processors: [
    {
      id: "grinder-processor",
      name: "Grinder KubeJS",
      description: "Handles grinder recipes",
      machineId: "industrial_grinder", // CRITICAL: This links the processor to the machine
      /**
       * @param {Recipe} recipe - The current recipe object
       * @param {Machine} machine - The machine definition used
       * @param {Resource[]} resources - Full list of resources for lookup
       * @returns {string} - The generated script snippet
       */
      handler: (recipe, machine, resources) => {
        const inputs = recipe.inputs.map(i => `'${i.resourceId}'`).join(', ');
        const outputs = recipe.outputs.map(o => `'${o.resourceId}'`).join(', ');
        return `event.recipes.grinder.process([${outputs}], [${inputs}])`;
      }
    },
    {
      id: "furnace-processor",
      name: "Furnace KubeJS",
      description: "Handles standard furnace recipes",
      machineId: "furnace", // You can target built-in machines too
      handler: (recipe, machine, resources) => {
        const input = recipe.inputs[0].resourceId;
        const output = recipe.outputs[0].resourceId;
        return `event.smelting('${output}', '${input}')`;
      }
    }
  ]
};
```

## How It Works

1. **Mapping**: When you use "Generate Code" (生成代码) and select this plugin, the system iterates through every recipe you've defined.
2. **Lookup**: For each recipe, it looks for a processor in your plugin where `processor.machineId === recipe.machineId`.
3. **Execution**: If a match is found, your `handler` function is called to generate a code snippet for that recipe.
4. **Aggregation**: All snippets are joined into a single preview/downloadable file.
5. **Skipping**: If a recipe belongs to a machine your plugin doesn't support, it is silently skipped.

## Pro Tips

- **Built-in IDs**: You can write processors for built-in machines like `furnace`, `crusher`, `chemical_reactor`, or `centrifuge`.
- **Validation**: Use the `resources` list to fetch metadata or names: `resources.find(r => r.id === id)?.name`.
- **Metadata**: Access custom metadata fields via `recipe.metadata.your_key`.


# Modpack Architect Plugin Guide

Plugins are JavaScript files (`.js`) that allow you to register custom machines and define script processors to export your recipes in formats like KubeJS, CraftTweaker, or JSON.

## Plugin Structure

A plugin must return a JavaScript object with the following structure:

```javascript
return {
  id: "my-plugin-id",
  name: "My Awesome Plugin",
  description: "Exports recipes in a custom format.",
  version: "1.0.0",
  // Optional: Machines registered by this plugin
  machines: [
    {
      id: "super_furnace",
      name: "Super Furnace",
      description: "A fast furnace from my mod.",
      inputs: [{ type: "item", label: "Input" }],
      outputs: [{ type: "item", label: "Result" }],
      metadataSchema: [{ key: "chance_1", label: "次要输出的输出概率", type: "number" }]
    }
  ],
  // Export processors
  processors: [
    {
      id: "kubejs-server-scripts",
      name: "KubeJS Server",
      description: "Generates server_scripts/recipes.js",
      /**
       * @param {Recipe} recipe - The current recipe object
       * @param {Machine} machine - The machine definition used
       * @param {Resource[]} resources - Full list of resources for lookup
       * @returns {string} - The generated script snippet
       */
      handler: (recipe, machine, resources) => {
        const inputs = recipe.inputs.map(i => `'${i.resourceId}'`).join(', ');
        const outputs = recipe.outputs.map(o => `'${o.resourceId}'`).join(', ');
        
        return `event.recipes.${machine.id}([${outputs}], [${inputs}]).duration(${recipe.duration})`;
      }
    }
  ]
};
```

## How to Install

1. Create a `.js` file with the content above.
2. Go to **Management Console** > **Plugins**.
3. Drag and drop your `.js` file or click to upload.
4. Once loaded, click on any resource in the main view.
5. In the **Resource Detail Panel**, your generated scripts will appear in the "Generated Scripts" section for every recipe involving that resource.

## Pro Tips

- **Validation**: If your script has a syntax error, the app will show an error notification.
- **Complexity**: You can use the `recipe.metadata` field (defined in your machine's `metadataSchema`) to add custom values like "Success Chance" or "Temperature" and access them in your `handler`.
- **Global Context**: The `resources` array allows you to find display names using `resources.find(r => r.id === id)?.name`.

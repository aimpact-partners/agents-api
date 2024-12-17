# Para correr el caso de uso

Levantar el servicio de la distribucion node del paquete ailearn, el puerto de inspeccion es el 8083

```ts
var { Fire } = await bimport("@aimpact/ailearn/fire");
var model = new Fire();
var r = await model.collection("assignments");
var data = await r.get();
```

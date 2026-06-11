# Regles du repo

## Frontieres de modules

Un module metier ne doit jamais importer directement un autre module metier.

Un module peut importer:

- ses propres fichiers, avec des imports relatifs dans le meme dossier de module;
- les packages externes;
- les couches explicitement partagees: `shared`, `db`, `env`;
- une couche d'orchestration dediee, quand elle existe pour coordonner plusieurs modules.

Un module ne peut pas importer `service`, `storage`, `routes`, `model` ou tout autre fichier provenant d'un autre module metier.

Exemples interdits:

```ts
import { UserService } from "../user/user.service.js"
import { OrganizationStorage } from "../organization/organization.storage.js"
import { Role } from "../role/role.model.js"
```

Exemples autorises:

```ts
import { AuthStorage } from "./auth.storage.js"
import { db } from "../db/client.js"
import { requestJson } from "../shared/api-client/index.js"
import { Effect } from "effect"
```

Les interactions entre modules metier passent par une couche d'orchestration, un client API, ou une interface partagee explicitement concue pour ca.

## Storage

Les fichiers `*.storage.ts` sont des details internes a leur module.

Un storage ne doit jamais importer un storage, service, route, model ou autre fichier provenant d'un autre module metier.

Un module externe ne doit jamais importer directement le storage d'un autre module.

Le chemin normal est:

```txt
route -> service -> storage
```

Le storage peut importer seulement:

- ses propres types/fichiers du meme module;
- `db` et le schema de base de donnees;
- les utilitaires explicitement partages;
- les packages externes.

Si une operation a besoin de donnees de plusieurs modules, elle doit etre faite dans une couche d'orchestration ou via un client/API, pas en croisant les storages.

## Auth

Le module `auth` ne depend pas du module `user`.

`/auth/login` valide les identifiants, verifie le mot de passe et retourne seulement une session avec un bearer token.

Le bearer token contient seulement l'identifiant utilisateur et son expiration. Il ne contient pas de profil utilisateur.

`authGuard` valide seulement le bearer token, extrait `userId`, puis fournit `AuthenticatedUserId`. Il ne fetch pas le user.

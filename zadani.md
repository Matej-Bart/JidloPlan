 Zadání projektu – JidloPlan

Vytvořte webovou aplikaci v JavaScriptu pro plánování jídel. Aplikace načítá recepty z REST API Spoonacular, umožňuje jejich ukládání, sestavení týdenního plánu a automatické generování nákupního seznamu s podporou vlastních položek. Aplikace musí fungovat jako PWA s offline podporou.

## Technické požadavky

- DOM manipulace bez frameworku
- REST API Spoonacular
- ukládání dat do `localStorage`
- responzivní design (desktop, tablet, mobil)
- PWA manifest + service worker
- záložní lokální recepty při výpadku API
- dokumentace v Markdownu

## Použít endpointy

| Endpoint | Účel |
|---|---|
| `GET /recipes/complexSearch?query={query}&addRecipeInformation=true` | vyhledávání |
| `GET /recipes/complexSearch?cuisine={cuisine}&addRecipeInformation=true` | filtr podle kuchyně |
| `GET /recipes/random?number=12` | náhodné recepty |
| `GET /recipes/{id}/information` | detail receptu |

## localStorage

| Klíč | Obsah |
|---|---|
| `jidlplan:favorites` | oblíbené recepty |
| `jidlplan:weekly-plan` | týdenní plán |
| `jidlplan:custom-shopping` | vlastní položky nákupního seznamu |
| `jidlplan:checked-shopping` | nakoupené položky |


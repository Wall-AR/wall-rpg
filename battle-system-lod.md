# The Legend of Dragoon — Sistema de Batalha

## Comandos de Batalha

1. **Attack** — Ataque físico com Additions (QTEs)
2. **Guard** — Reduz dano em 50% + recupera 1/10 do HP máximo
3. **Items** — Usar itens
4. **Run** — Fugir (desativado em chefes)
5. **Dragoon** — Transformação (precisa de 100+ SP)
6. **Special** — Só aparece quando todos os 3 personagens têm SP máximo

---

## Additions (Sistema de Combo)

Quando você escolhe **Attack**, o personagem corre no inimigo e aparecem **dois quadrados azuis** — um fixo no centro, outro girando e encolhendo. Você aperta **X** quando eles se sobrepõem.

**Características:**
- Cada personagem (exceto Shana/Miranda) tem Additions únicas
- Novas Additions são desbloqueadas conforme o **nível do personagem**
- Cada Addition tem um número de **pressionamentos** (1 a 7)
- A Addition final de cada personagem exige **dominar todas as anteriores** (80 usos cada)

**Level das Additions:**
- LV 1 → 20 usos → LV 2 → 40 usos → LV 3 → 60 usos → LV 4 → 80 usos → LV 5 (máximo)
- A cada nível aumenta **dano** e/ou **SP ganho**

**Counterattack:**
- Inimigo contra-ataca: quadrados ficam **vermelhos** + som
- Troque **X** por **Círculo** no timing certo
- Falhar = Addition cancelada + personagem toma dano

### Additions de Dart (Fire)
| Nome | Toques | Dano% (LV5) | SP (LV5) | Desbloqueio |
|---|---|---|---|---|
| Double Slash | 1 | 202% | 35 | Inicial |
| Volcano | 3 | 250% | 36 | LV 2 |
| Burning Rush | 2 | 150% | 102 | LV 8 |
| Crush Dance | 4 | 250% | 100 | LV 15 |
| Madness Hero | 5 | 100% | 204 | LV 22 |
| Moon Strike | 6 | 350% | 20 | LV 29 |
| **Blazing Dynamo** | 7 | 450% | 150 | Master |

### Additions de Lavitz / Albert (Wind)
| Nome | Toques | Dano% (LV5) | SP (LV5) |
|---|---|---|---|
| Harpoon | 1 | 150% | 50 |
| Spinning Cane | 2 | 200% | 35 |
| Rod Typhoon | 4 | 202% | 100 |
| Gust of Wind Dance | 6 | 350% | 35 |
| **Blossom Storm** | 7 | 405% | 202 |

### Additions de Rose (Darkness)
| Nome | Toques | Dano% (LV5) | SP (LV5) |
|---|---|---|---|
| Whip Smack | 1 | 200% | 35 |
| More & More | 2 | 150% | 102 |
| Hard Blade | 5 | 300% | 35 |
| **Demon's Dance** | 7 | 500% | 100 |

### Additions de Haschel (Thunder)
| Nome | Toques | Dano% (LV5) | SP (LV5) |
|---|---|---|---|
| Double Punch | 1 | 150% | 50 |
| Flurry of Styx | 2 | 202% | 20 |
| Summon 4 Gods | 3 | 100% | 100 |
| 5 Ring Shattering | 4 | 300% | 50 |
| Hex Hammer | 6 | 400% | 15 |
| **Omni-Sweep** | 7 | 501% | 150 |

### Additions de Meru (Water)
| Nome | Toques | Dano% (LV5) | SP (LV5) |
|---|---|---|---|
| Double Smack | 1 | 150% | 34 |
| Hammer Spin | 3 | 202% | 70 |
| Cool Boogie | 4 | 100% | 200 |
| Cat's Cradle | 6 | 351% | 20 |
| **Perky Step** | 7 | 600% | 100 |

### Additions de Kongol (Earth)
| Nome | Toques | Dano% (LV5) | SP (LV5) |
|---|---|---|---|
| Pursuit | 1 | 150% | 35 |
| Inferno | 3 | 100% | 20 |
| **Bone Crush** | 7 | 200% | 100 |

---

## Dragoon System

### Transformação
- Requer **100 SP** acumulados
- Cada 100 SP = **1 turno** em forma Dragoon (máx 300 SP = 3 turnos consecutivos)
- SP é ganho ao completar Additions (o valor depende da Addition equipada)
- SP **não reseta** entre batalhas
- SP excedente (acima do limite) ainda conta para **nível Dragoon**
- SP máximo armazenável: **500**

**Na forma Dragoon:**
- Stats ganham **multiplicadores** enormes
- Imune a **status ailments**
- Apenas **2 comandos**: D-Attack e Magic
- **Não pode** usar Guard, Items, ou Escape
- Só volta ao normal quando o SP acabar

### D-Attack (Dragoon Addition)
- Aparece um **mostrador circular** com uma luz girando
- Aperte **X** quando a luz passar pelo topo
- Máximo de **5 rotações** (Kongol: 4)
- A velocidade **aumenta** a cada acerto
- Se perfeito: animação elemental especial no final (dano ainda é físico)
- **Não** ganha SP, **não** sobe de nível

### Dragoon Magic (Magias)
- Usam **MP** (não SP)
- Cada personagem tem magias únicas do seu elemento
- Novas magias desbloqueadas nos Dragoon Levels 2, 3 e 5

### Níveis Dragoon (D'Level)
| Nível | SP Acumulado Necessário |
|---|---|
| 1 | 0 (inicial) |
| 2 | 1.200 |
| 3 | 6.000 |
| 4 | 12.000 |
| 5 | 20.000 |

**Bônus no D'Level 5 (multiplicadores de stats):**
- Dart: 220% AT, 250% DF, 220% MAT, 250% MDF
- Shana/Miranda: 150% AT, 200% DF, 250% MAT, 200% MDF
- Meru: 220% AT, 250% DF, 170% MAT, 250% MDF

### Special Transformation
- Disponível quando **todos os 3 personagens** têm SP máximo
- Transforma o **grupo inteiro** em Dragoons
- O personagem que iniciou recebe **bônus extra** (D-Attacks automáticos perfeitos)
- O elemento de quem iniciou causa **1.5x dano**; elemento oposto causa **0.5x**

---

## Elementos (Afinidades)

| Elemento | Forte Contra | Fraco Contra | Personagem |
|---|---|---|---|
| **Fire** | Water | Water | Dart |
| **Water** | Fire | Fire | Meru |
| **Wind** | Earth | Earth | Lavitz/Albert |
| **Earth** | Wind | Wind | Kongol |
| **Light** | Darkness | Darkness | Shana/Miranda |
| **Darkness** | Light | Light | Rose |
| **Thunder** | — | — | Haschel |
| **Non-Elemental** | Todos | Nada | Dart (Divino) |

**Regras:**
- Mesmo elemento = dano **cortado pela metade**
- Elemento oposto = dano **dobrado**
- Thunder não tem oposto (nem vantagem, nem desvantagem)
- Non-Elemental causa dano cheio em todos

---

## Magias Dragoon Detalhadas

### Dart — Red-Eyed Dragon (Fire)
| Magia | Dano | Alvo | MP | D'Level |
|---|---|---|---|---|
| Flameshot | 50% | 1 inimigo | 10 | 1 |
| Explosion | 25% | Todos | 20 | 2 |
| Final Burst | 75% | 1 inimigo | 30 | 3 |
| Red-Eye Dragon | 175% | Todos | 80 | 5 |

### Dart — Divine Dragon (Non-Elemental)
| Magia | Dano | Alvo | MP |
|---|---|---|---|
| Divine Dragon Ball | 400% mult | Todos | — |
| Divine Dragon Cannon | 600% mult | 1 inimigo | — |

### Shana/Miranda — White-Silver Dragon (Light)
| Magia | Efeito | Alvo | MP |
|---|---|---|---|
| Moon Light | Revive + cura 100% | 1 aliado | 10 |
| Star Children | 25% dano Light | Todos inimigos | 20 |
| Gates of Heaven | Cura 100% | Todos aliados | 30 |
| White Silver Dragon | 100% dano + cura | Todos | 80 |

### Lavitz/Albert — Jade Dragon (Wind)
| Magia | Efeito | Alvo | MP |
|---|---|---|---|
| Wing Blaster | 35% dano | Todos inimigos | 20 |
| Blossom/Rose Storm | Reduz dano 50% em 3 turnos | Todos aliados | 20 |
| Gaspless | 100% dano | 1 inimigo | 30 |
| Jade Dragon | 75% dano | Todos inimigos | 80 |

### Rose — Dark Dragon (Darkness)
| Magia | Efeito | Alvo | MP |
|---|---|---|---|
| Astral Drain | Dano + cura (divide cura pelo grupo) | 1 inimigo + aliados | 10 |
| Death Dimension | Dano + medo (10% chance) | Todos inimigos | 20 |
| Demon's Gate | **Morte instantânea** | Todos inimigos | 30 |
| Dark Dragon | 400% mult dano | 1 inimigo | 80 |

### Haschel — Violet Dragon (Thunder)
| Magia | Dano | Alvo | MP |
|---|---|---|---|
| Atomic Mind | 50% | 1 inimigo | 10 |
| Thunder Kid | 65% | 1 inimigo | 20 |
| Thunder God | 75% | 1 inimigo | 30 |
| Violet Dragon | 100% | 1 inimigo | 80 |

### Meru — Blue Sea Dragon (Water)
| Magia | Efeito | Alvo | MP |
|---|---|---|---|
| Freezing Ring | 50% dano | 1 inimigo | 10 |
| Rainbow Breath | Cura + remove calamidades | Todos aliados | 20 |
| Diamond Dust | 50% dano | Todos inimigos | 30 |
| Blue Sea Dragon | 100% dano | 1 inimigo | 80 |

### Kongol — Golden Dragon (Earth)
| Magia | Dano | Alvo | MP |
|---|---|---|---|
| Grand Stream | 25% | Todos inimigos | 20 |
| Meteor Strike | 50% | Todos inimigos | 30 |
| Golden Dragon | 75% | Todos inimigos | 80 |

---

## Fórmulas de Dano

**Addition Damage:**
- Cada hit tem dano base: `AT * (Multiplier%)`
- O Multiplier é um valor **oculto** específico de cada Addition/hit
- A Dmg% mostrada no menu é a combinação total assumindo execução perfeita

**Counterattack Damage:**
```
Dano recebido = (AT * 30% + RAND(1..100)) * Modificadores
```

**Spell Damage:**
```
Dano = MAT * (Spell Multiplier%) * Modificador Elemental
```
- Mesmo elemento: ×0.5
- Elemento oposto: ×2.0

---

## Status Ailments

| Ailment | Efeito | Cura |
|---|---|---|
| **Fear** | Reduz stats | Body Purifier |
| **Petrification** | Não age (impede transformação) | Depetrifier |
| **Confusion** | Ataca aliados | Mind Purifier |
| **Poison** | Dano por turno | Body Purifier |
| **Stun** | Pula turno | — |

- Chefes são **imunes** a status ailments
- Forma Dragoon **cura** todos os status
- Hotéis curam físicos; Clínicas curam mentais

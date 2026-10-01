# Economic Engine Validation

The TypeScript engine was checked against the supplied Python V4 implementation using baseline calibrations.

| Model | Python | TypeScript |
|---|---:|---:|
| Goods market equilibrium Y | 725.0000000000001 | 725.0000000000001 |
| Money-market r | 0.05 | 0.05 |
| IS–LM Y | 768.4210526315791 | 768.4210526315791 |
| IS–LM r | 0.021052631578947385 | 0.021052631578947385 |
| AD–AS Y | 1000.0 | 1000 |
| AD–AS P | 1.0 | 1 |
| Mundell–Fleming Y | 1000.0 | 1000 |
| Solow k* | 5.771752844662493 | 5.771752844662493 |
| Fiscal final debt ratio | 0.6935742633576841 | 0.6935742633576841 |
| Monetary transmission peak output gap (2pp tightening) | -1.1264625000000001 | -1.1264625000000001 |
| Policy Lab fiscal expansion: IS–LM Y | 894.7368421052633 | 894.7368421052633 |
| Policy Lab fiscal expansion: AD–AS Y | 1084.122060508875 | 1084.122060508875 |

Floating-point formatting can differ, but the underlying numerical results match.

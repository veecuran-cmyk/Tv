// comandos.js: Lógica de Interação, Ambiente e Objetivos

let player = null;
let playerName = null;
let allPlayers = {};
let worldState = {};
let mortesSession = 0; // Contador de mortes da partida
let isRespawning = false; // Trava para evitar comandos enquanto renasce

const terminal = document.getElementById('terminal');
const input = document.getElementById('input');
const fixed = document.getElementById('fixed');

function print(msg) {
    const newDiv = document.createElement('div');
    newDiv.innerHTML = msg;
    
    newDiv.setAttribute('tabindex', '-1'); 
    terminal.appendChild(newDiv);
    terminal.scrollTop = terminal.scrollHeight;
}

// 1. Processador de Comandos Principal
input.addEventListener('keypress', async e => {
    if (isRespawning) return;
    if (e.key === 'Enter') {
        const rawCmd = input.value.trim();
        const args = rawCmd.split(' ');
        const cmd = args[0].toLowerCase();
        input.value = '';

        if (!rawCmd) return;
        print(`<span style="color: #666">> ${rawCmd}</span>`);

        // SISTEMA DE LOGIN
        if (!player) {
            const heroFound = Object.keys(HEROES).find(h => h.toLowerCase() === rawCmd.toLowerCase());
            if (heroFound) {
                playerName = prompt("Digite seu nome de usuário:");
                if (!playerName) return print("Nome obrigatório!");
                player = { ...HEROES[heroFound], name: playerName, heroType: heroFound, location: 'BaseAliada', gold: 500, inventory: [], effects: [], xp: 0, mortes: 0};
                playersRef.child(playerName).set(player);
                print(`<span style="color: #00ff41">Bem-vindo, ${playerName}. Você é o portador do Miraculous de ${heroFound}!</span>`);
            } else {
                print("Escolha seu herói: " + Object.keys(HEROES).join(", "));
            }
            return;
        }

        // --- DICIONÁRIO COMPLETO DE COMANDOS ---
        switch (cmd) {
            case '/ajuda':
                print("<b>MAPA:</b> /ir [local], /locais, /ver, ,/coletar");
                print("<b>LUTAR:</b> /atacar [alvo], /q [alvo], /w, /e, /r [alvo],/descansar");
                print("<b>LOJA:</b> /loja, /comprar [item], /usar [item], /vender");
                print("<b>INFO:</b> /status, /stats [alvo], /limpar,/pivo,/estrutura");
                break;
            
                break;
            case '/locais':
                print("<b>Locais Disponíveis:</b> " + MAP_LOCATIONS.join(" | "));
                break;

            case '/ver':
                print(`--- Você está em: <b>${player.location}</b> ---`);
                const locais = Object.values(allPlayers).filter(p => p.location === player.location && p.name !== playerName);
                if (locais.length > 0) print("Jogadores presentes: " + locais.map(p => p.name).join(", "));
                else print("Não há outros heróis aqui.");
                break;

            case '/descansar':
                // 1. Verificação de Local
                if (player.location !== "BaseAliada" && player.location !== "BaseInimiga") {
                    return print("❌ Você só pode descansar no conforto e segurança da sua <b>Base</b>!");
                }
                
                // 2. Verificação de Ouro (Custo de 10g)
                if (player.gold < 10) {
                    return print("❌ O estalajadeiro negou sua entrada! Você precisa de <b>10 de ouro</b> para descansar.");
                }

                // 3. Verificação se já está cheio
                if (player.hp >= player.hp_max && player.mana >= player.mana_max) {
                    return print("✅ Você já está totalmente recuperado e pronto para a luta!");
                }

                // 4. Execução do Descanso
                player.gold -= 10; // Cobra a taxa

                const curaHp = Math.floor(player.hp_max * 0.3); // Recupera 30% da vida
                const curaMana = Math.floor(player.mana_max * 0.3); // Recupera 30% da mana

                player.hp = Math.min(player.hp + curaHp, player.hp_max);
                player.mana = Math.min(player.mana + curaMana, player.mana_max);

                print("<b>[REPOUSO]</b> Você pagou 10g e descansou nos quartéis...");
                print(`❤️ HP: +${curaHp} | ✨ Mana: +${curaMana} | 💰 Ouro: -10g`);
                
                save();
                break;

                

            case '/ir':
                if (player.inCombat) return print("🚫 Você não pode viajar enquanto está em combate!");
                const dest = args[1];
                if (MAP_LOCATIONS.includes(dest)) {
                    player.location = dest;
                    print(`Movendo para ${dest}...`);
                    save();
                } else print("Local inválido. Use /locais.");
                break;
                case '/estrutura':
                const filtro = args[1] ? args[1].toLowerCase() : 'tudo';
                print(`--- 🛡️ STATUS DAS DEFESAS (${filtro.toUpperCase()}) ---`);

                const exibirHP = (nome, idLocal) => {
                    let hpAtual = (worldState && worldState.torres && worldState.torres[idLocal]) 
                                  ? worldState.torres[idLocal] 
                                  : INITIAL_TOWERS_HP;
                    
                    let hpMax = idLocal === 'Nucleo' ? NUCLEO_MAX_HP : INITIAL_TOWERS_HP;
                    let percentual = Math.round((hpAtual / hpMax) * 100);
                    let cor = percentual > 60 ? "#00ff41" : (percentual > 25 ? "yellow" : "red");

                    print(`🔹 <b>${nome}:</b> <span style="color:${cor}">${hpAtual}/${hpMax} HP</span>`);
                };

                // Define o que é "aliado" ou "inimigo" com base no time do jogador
                const meuTime = player.heroType; // "Heroi" ou "Vilao"
                const mostrarHeroi = (filtro === 'tudo' || (filtro === 'aliada' && meuTime === 'Heroi') || (filtro === 'inimiga' && meuTime === 'Vilao'));
                const mostrarVilao = (filtro === 'tudo' || (filtro === 'aliada' && meuTime === 'Vilao') || (filtro === 'inimiga' && meuTime === 'Heroi'));

                if (mostrarHeroi) {
                    print("<br><b style='color:cyan'>[ESTRUTURAS HERÓI]</b>");
                    exibirHP("Solo T1", "Solo:T1"); exibirHP("Solo T2", "Solo:T2"); exibirHP("Solo T3", "Solo:T3");
                    exibirHP("Mid T1", "Mid:T1");   exibirHP("Mid T2", "Mid:T2");   exibirHP("Mid T3", "Mid:T3");
                    exibirHP("Duo T1", "Duo:T1");   exibirHP("Duo T2", "Duo:T2");   exibirHP("Duo T3", "Duo:T3");
                    if (meuTime === 'Vilao') exibirHP("NÚCLEO INIMIGO", "Nucleo");
                    else exibirHP("NÚCLEO ALIADO", "Nucleo");
                }

                if (mostrarVilao) {
                    print("<br><b style='color:red'>[ESTRUTURAS VILÃO]</b>");
                    // Nota: Se o seu line.js diferenciar as torres por time (ex: Solo:T1:Vilao), 
                    // ajuste os IDs abaixo. Caso contrário, ele mostra o status global da rota.
                    exibirHP("Solo T1", "Solo:T1"); exibirHP("Solo T2", "Solo:T2"); exibirHP("Solo T3", "Solo:T3");
                    exibirHP("Mid T1", "Mid:T1");   exibirHP("Mid T2", "Mid:T2");   exibirHP("Mid T3", "Mid:T3");
                    exibirHP("Duo T1", "Duo:T1");   exibirHP("Duo T2", "Duo:T2");   exibirHP("Duo T3", "Duo:T3");
                    if (meuTime === 'Heroi') exibirHP("NÚCLEO INIMIGO", "Nucleo");
                    else exibirHP("NÚCLEO ALIADO", "Nucleo");
                }

                print("<br><i>Use /estrutura aliada ou /estrutura inimiga para filtrar.</i>");
                break;

                case '/pivo':
                const escolha = args[1] ? args[1].toLowerCase() : null;
                const timesValidos = ["heroi", "vilao"];

                // 1. Verificação de Argumento
                if (!escolha || !timesValidos.includes(escolha)) {
                    return print("❌ Escolha um lado! Use: <b>/pivo heroi</b> ou <b>/pivo vilao</b>");
                }

                // Traduz a escolha para o formato do sistema
                const novoTime = escolha === "heroi" ? "Heroi" : "Vilao";

                // 2. Impede trocar para o mesmo time que já está
                if (player.heroType === novoTime) {
                    return print(`❌ Você já faz parte do time dos <b>${novoTime}s</b>!`);
                }

                // 3. Custos de Troca
                const custoOuro = 200;
                const custoMana = 50;
                const custoVidaPercentual = 0.4;

                if (player.inCombat) return print("❌ Você não pode desertar em combate!");
                if (player.gold < custoOuro) return print(`❌ Ouro insuficiente (${custoOuro}g necessários).`);
                if (player.mana < custoMana) return print(`❌ Mana insuficiente (${custoMana} de mana necessária).`);

                // 4. Aplicação da Mudança
                player.gold -= custoOuro;
                player.mana -= custoMana;
                
                const perdaVida = Math.floor(player.hp * custoVidaPercentual);
                player.hp = Math.max(1, player.hp - perdaVida);

                player.heroType = novoTime;
                // Define a base de destino com base no novo time
                player.location = (novoTime === "Vilao") ? "BaseInimiga" : "BaseAliada";

                print("======= 🎭 TROCA DE LEALDADE =======");
                print(`Você agora é um <b>${novoTime}</b>!`);
                print(`💰 Pago: ${custoOuro}g | ✨ Gasto: ${custoMana}m | 🩸 Sacrifício: -${perdaVida} HP`);
                print(`📍 Movido para: <b>${player.location}</b>`);
                print("====================================");

                save();
                break;
            case '/atacar':
                const targetName = args[1];
                if (!targetName) return print("Use: /atacar [NomeInimigo ou NomeTorre]");
                
                // Lógica de ataque a Player
                const targetP = allPlayers[targetName];
                if (targetP && targetP.location === player.location) {
                    const dmg = Math.max(player.ataque_fisico - (targetP.def_fisica / 2), 5);
                    targetP.hp -= dmg;
                    player.xp += 15;
                    print(`Você golpeou ${targetName} e causou ${dmg.toFixed(0)} de dano!`);
                    playersRef.child(targetName).update(targetP);
                    save();
                } 
                // Lógica de ataque a Torres/Objetivos
                else if (targetName.includes('T') || targetName === 'Nucleo') {
                    // Simulação de dano a torre no firebase
                    gameStateRef.child('nucleo_hp').transaction(hp => hp - 10);
                    print(`Você está atacando o ${targetName}!`);
                }
                else print("Alvo não está aqui.");
                break;
                // Dentro do switch(cmd) no comandos.js

    case '/coletar':
        Entidades.coletarNaJungle(player, print);
        save();
        break;

    case '/vender':
        if (player.location !== "BaseAliada") {
            return print("Você só pode vender seus materiais na <b>Base Aliada</b>!");
        }

        if (!player.materiais || player.materiais.length === 0) {
            return print("Você não possui materiais para vender.");
        }

        let totalOuro = 0;
        player.materiais.forEach(m => {
            
            // Comuns
if (m === "PedraFerrosa") totalOuro += 30;
if (m === "FragmentoCobre") totalOuro += 40;
if (m === "FragmentoComum") totalOuro += 50; // Original
if (m === "SilicaBrilhante") totalOuro += 60;
if (m === "CarvaoVital") totalOuro += 70;

// Incomuns
if (m === "LingotePrata") totalOuro += 100;
if (m === "AcoNegro") totalOuro += 115;
if (m === "QuartzoRosa") totalOuro += 130;
if (m === "PiritaDourada") totalOuro += 140;

// Raros
if (m === "FragmentoRaro") totalOuro += 150; // Original
if (m === "ObsidianaFria") totalOuro += 180;
if (m === "CobaltoCeleste") totalOuro += 220;
if (m === "AdamantiteBruto") totalOuro += 260;
if (m === "MithrilPuro") totalOuro += 300;

// Épicos
if (m === "Orichalcum") totalOuro += 400;
if (m === "CristalVazio") totalOuro += 450;
if (m === "PedraSolfar") totalOuro += 500;
if (m === "EletroAzul") totalOuro += 550;

// Lendários
if (m === "FragmentoLendario") totalOuro += 600; // Original
if (m === "LuzEterna") totalOuro += 800;
if (m === "MateriaEscura") totalOuro += 1200;
if (m === "SangueDragao") totalOuro += 2500;
if (m === "Divindade") totalOuro += 10000;
        });

        print(`💰 Negócio fechado! Você vendeu ${player.materiais.length} itens por <b>${totalOuro} ouro</b>.`);
        player.gold += totalOuro;
        player.materiais = []; // Limpa o "saco de materiais"
        save();
        break;

            case '/q': case '/w': case '/e':
                const skillKey = cmd.replace('/', '');
                const skillTarget = args[1] || playerName;
                const skillObj = allPlayers[skillTarget];
                if (skillObj) {
                    const res = processSkill(skillKey, player, skillObj);
                    if (res.success) {
                        playersRef.child(skillTarget).update(skillObj);
                        save();
                    }
                    print(res.msg);
                }
                break;

            case '/r':
                const rTarg = args[1];
                const rExtra = args[2] || "";
                const rObj = allPlayers[rTarg] || null;
                const ultRes = executeUltimate(player, playerName, rObj, rTarg, rExtra, allPlayers);
                if (ultRes.success) save();
                print(ultRes.msg);
                break;
            
            case '/loja':
                print("============== 🛒 MERCADO ==============");

                // 1. Exibição dos Itens Menores (Atributos)
                print("<br><b style='color:#00ffff'>[1] MATERIAIS DE FORJA (Atributos)</b>");
                print("<i>Aumentam status permanentemente. Use /comprar Nome+Nivel</i>");
                print("• <b>Preço:</b> Nível 1 (150g) ... até ... Nível 4 (600g)");
                print("• <b>Disponíveis:</b> AtaqueFisico, AtaqueMagico, DefFisica, DefMagica, VelAtaque");

                // 2. Exibição das Receitas (Itens Completos)
                print("<br><b style='color:#ffcc00'>[2] ARSENAL AVANÇADO (Receitas)</b>");
                print("<i>Itens poderosos que exigem ouro + itens menores.</i>");
                
                // Itera sobre as receitas definidas no itens.js para mostrar os requisitos
                if (typeof RECIPES !== 'undefined') {
                    Object.entries(RECIPES).forEach(([nome, receita]) => {
                        // Formata a lista de requisitos
                        let ingredientes = receita.req.length > 0 
                            ? `<span style='color:#aaa'>Exige: ${receita.req.join(" + ")}</span>` 
                            : "<span style='color:#00ff41'>[Item Base]</span>";
                        
                        print(`🔸 <b>${nome}</b>: ${receita.custo}g | ${ingredientes}`);
                    });
                } else {
                    print("Erro: As receitas não foram carregadas do itens.js");
                }
                
                print("<br><i>Comando: /comprar [NomeDoItem]</i>");
                break;
            case '/comprar':
    const itemNome = args[1]; // Ex: AtaqueFisico+1 ou EscudoFisico
    if (!itemNome) return print("Use: /comprar [NomeDoItem]");

    // canBuyItem retorna { can: bool, price: int, consume: array, reason: string }
    const buy = canBuyItem(player, itemNome); 
    
    if (buy.can) {
        // Verifica limite de inventário (6 espaços)
        if (player.inventory.length >= 6 && !buy.consume.length) {
            return print("❌ Inventário cheio!");
        }

        player.gold -= buy.price;

        // 1. Remove os ingredientes do inventário
        if (buy.consume && buy.consume.length > 0) {
            buy.consume.forEach(cItem => {
                const idx = player.inventory.indexOf(cItem);
                if (idx > -1) player.inventory.splice(idx, 1);
            });
        }

        // 2. Aplica o efeito e salva no inventário
        // Se for item de atributo (Mini Item), aplicamos direto
        if (itemNome.includes('+')) {
            applyItemEffect(player, itemNome);
            print(`✅ Atributo expandido: <b>${itemNome}</b> por ${buy.price}g!`);
        } else {
            // Se for item completo/consumível, vai para o inventário
            player.inventory.push(itemNome);
            print(`✅ Você comprou: <b>${itemNome}</b> por ${buy.price}g!`);
        }

        save(); 
    } else {
        print(`❌ ${buy.reason}`);
    }
    break;


            case '/usar':
                const uItem = args[1];
                const uIdx = player.inventory.indexOf(uItem);
                if (uIdx > -1) {
                    applyItemEffect(player, uItem);
                    player.inventory.splice(uIdx, 1);
                    print(`Item ${uItem} ativado.`);
                    save();
                } else print("Você não tem esse item.");
                
                break;

            case '/status':
                print(`--- STATUS ATUAL: ${player.heroType} ---`);
                print(`name ${player.name}|mortes:${player.mortes}`);
                print('-----------------------------');
                print(`HP: ${player.hp}/${player.hp_max} | Gold: ${player.gold} | `);
                print('----------------------------');
                print(`Level: ${player.level}|XP: ${player.xp}`);
                print('----------------------------');
                print(`Atf: ${player.ataque_fisico}|Atm: ${player.ataque_magico}|DFF: ${player.def_fisica}|DFM: ${player.def_magica}`);
                break;

            case '/stats':
    const busca = args[1];
    const alvo = busca ? allPlayers[busca] : player;

    if (alvo) {
        print(`--- STATUS DE: ${alvo.name}---`);
        print(`Name:${alvo.heroType}| mortes:${alvo.mortes}`);
        print('-----------------------------');
        print(`HP: ${alvo.hp.toFixed(0)}/${alvo.hp_max} | Gold: ${alvo.gold} | `);
        print('----------------------------');
        print(`Level: ${alvo.level}|XP: ${alvo.xp}`);
        print('----------------------------');
        print(`Atf: ${alvo.ataque_fisico}|Atm: ${alvo.ataque_magico}|DFF: ${alvo.def_fisica}|DFM: ${alvo.def_magica}`);
        print('----------------------------');
    } else {
        print(`Erro: Jogador "${busca}" não encontrado.`);
    }
    break;

            case '/limpar':
                terminal.innerHTML = "";
                break;

            default:
                chatRef.push(`${playerName}: ${rawCmd}`);
                break;
        }
    }
});

// 2. Monitoramento em Tempo Real
playersRef.on('value', snap => {
    allPlayers = snap.val() || {};
    if (playerName && allPlayers[playerName]) {
        player = allPlayers[playerName];
        
        // HUD Inferior
        fixed.innerHTML = `[${player.heroType}] HP: ${player.hp.toFixed(0)} | Mana: ${player.mana.toFixed(0)} | Gold: ${player.gold} | Loc: ${player.location}`;

        // Lógica de Morte
        // Dentro do playersRef.on('value', snap => { ...

// Lógica de Morte Simplificada no Terminal
if (player.hp <= 0 && !isRespawning) {
    isRespawning = true;
    mortesSession++; // Aumenta o contador
    player.mortes = (player.mortes || 0) + 1; // Soma 1 ao contador de mortes
    print("<br>========================================");
    print("<b style='color:red'>[SISTEMA] VOCÊ FOI DERROTADO!</b>");
    print(`<b style='color:orange'>PLACAR DE MORTES: ${mortesSession}</b>`);
    print("<i style='color:gray'>Recompondo dados do herói... aguarde 5s.</i>");
    print("========================================<br>");

    // Simulação de tempo de renascimento (bloqueio de 5 segundos)
    setTimeout(() => {
        player.hp = player.hp_max;
        player.location = "BaseAliada";
        isRespawning = false; // Libera o jogador
        
        save(); // Atualiza o Firebase
        print("<b style='color:#00ff41'>[SISTEMA] Conexão restabelecida. Você renasceu na base.</b>");
    }, 5000); // 5000ms = 5 segundos
}
        // Sistema de Experiência e Level
        const xpNecessario = player.level * 100;
        if (player.xp >= xpNecessario) {
            player.level++;
            player.xp = 0;
            player.hp_max += 50;
            player.ataque_fisico += 10;
            player.ataque_magico += 10;
            print(`<b style='color:cyan'>SUBIU DE NÍVEL! Agora você é Nível ${player.level}</b>`);
            save();
        }
    }
});

function save() {
    if (playerName) playersRef.child(playerName).update(player);
}

// Loop de Regeneração e Renda
setInterval(() => {
    if (player && playerName) {
        player.gold += 1;
        player.mana = Math.min(player.mana + 4, player.mana_max);
        Entidades.verificarDefesa(player, print);
        save();
    }
}, 2000);

// Este código roda sozinho sempre que alguém envia algo
chatRef.limitToLast(10).on('child_added', (snapshot) => {
    const dados = snapshot.val();
    
    // Se os dados forem um objeto (como no push acima)
    if (typeof dados === 'object') {
        print(`<b>${dados.autor}:</b> ${dados.texto}`);
    } else {
        // Caso o dado antigo fosse apenas uma string
        print(`<span style="color: #00ff41">${dados}</span>`);
    }
});


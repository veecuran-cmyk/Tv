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
                print("<b>MAPA:</b> /ir [local], /locais, /ver, /objetivos");
                print("<b>LUTAR:</b> /atacar [alvo], /q [alvo], /w, /e, /r [alvo],/farmar");
                print("<b>LOJA:</b> /loja, /comprar [item], /usar [item], /vender [item]");
                print("<b>INFO:</b> /status, /stats [alvo], /limpar");
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

            case '/objetivos':
                print("--- Saúde das Torres (World State) ---");
                // Aqui puxamos do gameStateRef definido no line.js
                gameStateRef.once('value', snap => {
                    const gs = snap.val();
                    print(`Núcleo: ${gs.nucleo_hp} HP`);
                    print(`Minions no Mid: ${gs.minions.Mid} | Solo: ${gs.minions.Solo} | Duo: ${gs.minions.Duo}`);
                });
                break;

            case '/ir':
                const dest = args[1];
                if (MAP_LOCATIONS.includes(dest)) {
                    player.location = dest;
                    print(`Movendo para ${dest}...`);
                    save();
                } else print("Local inválido. Use /locais.");
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
            case '/farmar':
    Entidades.iniciarCombate(player, save, print);
    break;
// Exemplo de integração no seu sistema de comandos:

// Adicione um comando de fuga
case '/fugir':
    if (player.inCombat) {
        // Chance de 50% de fugir
        if (Math.random() > 0.5) {
            Entidades.pararCombate(player);
            print("Você fugiu do combate com sucesso!");
            // Penalidade opcional: Entidade bate na torre
            Entidades.entidadeAtacaEstrutura(player.location, 50, print);
        } else {
            print("Falha ao fugir! O inimigo te acertou pelas costas.");
            player.hp -= 30; // Penalidade
        }
        save();
    } else {
        print("Não há do que fugir.");
    }
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
    const item = args[1];
    const buy = canBuyItem(player, item); // Nova função do itens.js
    if (buy.can) {
        player.gold -= buy.price;

        // Remove itens consumidos da receita (se houver)
        if (buy.consume && buy.consume.length > 0) {
            buy.consume.forEach(cItem => {
                const idx = player.inventory.indexOf(cItem);
                if (idx > -1) player.inventory.splice(idx, 1);
            });
            print(`Itens usados na criação: ${buy.consume.join(', ')}`);
        }

        player.inventory.push(item);
        print(`Você adquiriu: <b>${item}</b> por ${buy.price} Ouro!`);

        // Aplica efeito imediato se for passivo (opcional, dependendo da sua lógica)
        // applyItemEffect(player, item); 

        save();
    } else {
        print(buy.reason);
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
        player.gold += 5;
        player.mana = Math.min(player.mana + 4, player.mana_max);
        save();
    }
}, 4000);

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


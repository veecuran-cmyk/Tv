// comandos.js: Lógica de Interação, Ambiente e Objetivos

let player = null;
let playerName = null;
let allPlayers = {};
let worldState = {};

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
                player = { ...HEROES[heroFound], name: playerName, heroType: heroFound, location: 'BaseAliada', gold: 500, inventory: [], effects: [], xp: 0 };
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
                print("<b>LUTAR:</b> /atacar [alvo], /q [alvo], /w, /e, /r [alvo] [param]");
                print("<b>LOJA:</b> /loja, /comprar [item], /usar [item], /vender [item]");
                print("<b>INFO:</b> /status, /stats [alvo], /limpar");
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

            case '/loja':
                print("<b>ITENS:</b> EscudoFisico, EscudoMagico, CuraPesada, Vampirismo, ImunidadeTemp");
                print("<b>MINIS:</b> AtaqueFisico+1, AtaqueMagico+1, DefFisica+1");
                break;

            case '/comprar':
                const item = args[1];
                const buy = canBuyItem(player, item);
                if (buy.can) {
                    player.gold -= buy.price;
                    player.inventory.push(item);
                    print(`Você adquiriu: ${item}`);
                    save();
                } else print(buy.reason);
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
                print(`Skills Atuais: Q: ${player.q} | W: ${player.w} | E: ${player.e} | R: ${player.r}`);
                print(`HP: ${player.hp}/${player.hp_max} | Gold: ${player.gold} | XP: ${player.xp}`);
                break;

            case '/stats': // Ver status de outro player
                const sName = args[1];
                if (allPlayers[sName]) {
                    const s = allPlayers[sName];
                    print(`[${sName}] HP: ${s.hp.toFixed(0)} | Hero: ${s.heroType} | Local: ${s.location}`);
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
        if (player.hp <= 0) {
            print("<b style='color:red'>VOCÊ FOI DERROTADO!</b>");
            player.hp = player.hp_max;
            player.location = 'BaseAliada';
            save();
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

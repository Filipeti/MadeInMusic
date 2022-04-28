const Discord = require('discord.js');
const client = new Discord.Client({
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_VOICE_STATES"]
})

const { token, prefix } = require("./config.json")

client.on("ready", () => {
    console.log("ONLINE");
})

const { DisTube } = require("distube")
const { SpotifyPlugin } = require("@distube/spotify")
const { SoundCloudPlugin } = require("@distube/soundcloud")

const distube = new DisTube(client, {
    youtubeDL: false,
    plugins: [new SpotifyPlugin(), new SoundCloudPlugin()],
    leaveOnEmpty: true,
    leaveOnStop: true
})

client.on("messageCreate", message => {
    if (message.content.startsWith(`${prefix}play`)) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente in utilizzo da un altro utente, attendere il termine del processo...")
        }

        let args = message.content.split(/\s+/)
        let query = args.slice(1).join(" ")

        if (!query) {
            return message.reply("Inserire il brano da riprodurre.")
        }

        distube.play(voiceChannelBot || voiceChannel, query, {
            member: message.member,
            textChannel: message.channel,
            message: message
        })
    }

    if (message.content == `${prefix}pause`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente utilizzato da un altro utente, attendere il termine del processo...")
        }

        try {
            distube.pause(message)
                .catch(() => { return message.reply("🚫Non c'è alcun brano in riproduzione o in pausa.") })
        } catch {
            return message.reply("🚫Non c'è alcun brano in riproduzione o in pausa.")
        }

        message.reply("✅Il brano è stato messo in pausa correttamente.")
    }

    if (message.content == `${prefix}resume`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente in utilizzo da un altro utente, attendere il termine del processo...")
        }

        try {
            distube.resume(message)
                .catch(() => { return message.reply("🚫Nessuna canzone in riproduzione o canzone già in riproduzione.") })
        } catch {
            return message.reply("🚫Nessuna canzone in riproduzione o canzone già in riproduzione.")
        }

        message.reply("✅Il brano ha ripreso l'esecuzione correttamente.")
    }

    if (message.content == `${prefix}queue`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente in utilizzo da un altro utente, attendere il termine del processo...")
        }

        let queue = distube.getQueue(message)

        if (!queue) return message.reply("🚫La coda dei brani è vuota.")

        let totPage = Math.ceil(queue.songs.length / 10)
        let page = 1

        let songsList = ""
        for (let i = 10 * (page - 1); i < 10 * page; i++) {
            if (queue.songs[i]) {
                songsList += `${i + 1}. **${queue.songs[i].name.length <= 100 ? queue.songs[i].name : `${queue.songs[i].name.slice(0, 100)}...`}** - ${queue.songs[i].formattedDuration}\r`
            }
        }

        let embed = new Discord.MessageEmbed()
            .addField("Coda dei brani:", songsList)
            .setFooter({ text: `Pagina ${page}/${totPage}` })
            .setColor("RANDOM")

        let button1 = new Discord.MessageButton()
            .setLabel("Indietro")
            .setStyle("SUCCESS")
            .setCustomId("indietro")

        let button2 = new Discord.MessageButton()
            .setLabel("Avanti")
            .setStyle("SUCCESS")
            .setCustomId("avanti")

        if (page == 1) button1.setDisabled()
        if (page == totPage) button2.setDisabled()

        let row = new Discord.MessageActionRow()
            .addComponents(button1)
            .addComponents(button2)

        message.channel.send({ embeds: [embed], components: [row] })
            .then(msg => {
                const collector = msg.createMessageComponentCollector()

                collector.on("collect", i => {
                    i.deferUpdate()

                    if (i.user.id != message.author.id) return i.reply({ content: "Questo bottone non è tuo", ephemeral: true })

                    if (i.customId == "indietro") {
                        page--
                        if (page < 1) page = 1
                    }
                    if (i.customId == "avanti") {
                        page++
                        if (page > totPage) page = totPage
                    }

                    let songsList = ""
                    for (let i = 10 * (page - 1); i < 10 * page; i++) {
                        if (queue.songs[i]) {
                            songsList += `${i + 1}. **${queue.songs[i].name.length <= 100 ? queue.songs[i].name : `${queue.songs[i].name.slice(0, 100)}...`}** - ${queue.songs[i].formattedDuration}\r`
                        }
                    }

                    let embed = new Discord.MessageEmbed()
                        .addField("Queue", songsList)
                        .setFooter({ text: `Pagina ${page}/${totPage}` })
                        .setColor("RANDOM")

                    let button1 = new Discord.MessageButton()
                        .setLabel("Indietro")
                        .setStyle("SUCCESS")
                        .setCustomId("indietro")

                    let button2 = new Discord.MessageButton()
                        .setLabel("Avanti")
                        .setStyle("SUCCESS")
                        .setCustomId("avanti")

                    if (page == 1) button1.setDisabled()
                    if (page == totPage) button2.setDisabled()

                    let row = new Discord.MessageActionRow()
                        .addComponents(button1)
                        .addComponents(button2)

                    msg.edit({ embeds: [embed], components: [row] })
                })
            })
    }

    if (message.content == `${prefix}skip`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        try {
            distube.skip(message)
                .catch(() => { return message.channel.send("🚫Nessun brano in riproduzione o successivo non presente.") })
        } catch {
            return message.reply("🚫Nessun brano in riproduzione successivo non presente.")
        }

        message.reply("✅Il brano è stato saltato correttamente.")
    }

    if(message.content == `${prefix}remove`){
        const queue = message.client.queue.get(message.guild.id)
        if(isNaN(parseInt(args[0])) || !args[0]){
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        if(!queue) return message.reply("❌Impossibile rimuovere il brano indicato: nessun brano in riproduzione.") // If No Song Is Being Played.
        let remove = args[0] - 1
        let arr = queue.songs
        if(remove > arr.length || remove < 0 ) { return message.reply("Errore: inserire un numero valido.") } // If Number Is Not Their In Queue Or -ve.

        const embed = new MessageEmbed()
        .setTitle('❌Brano rimosso')
        .setColor('RANDOM')
        .addField(`Rimosso: **${arr[remove].title}**`, '❌')
        .addField('Rimosso da:', message.author)
        message.channel.send(embed)

        if(remove === 0) { skip.execute(message, ags) }
        else { arr.splice(remove, 1) }
        message.client.queue.set(message.guild.id, serverQueue)
    }

    if (message.content == `${prefix}previous`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente in utilizzo da un altro utente, attendere il termine del processo...")
        }

        try {
            distube.previous(message)
                .catch(() => { return message.reply("🚫Nessuna canzone in riproduzione o canzone precedente non presente") })
        } catch {
            return message.reply("🚫Nessun brano in riproduzione o precedente non presente")
        }

        message.reply("Caricamento del brano precedente...")
    }

    if (message.content == `${prefix}stop`) {
        const voiceChannel = message.member.voice.channel
        if (!voiceChannel) {
            return message.reply("🎤Devi necessariamente connetterti in un canale vocale per far partire la musica.")
        }

        const voiceChannelBot = message.guild.channels.cache.find(x => x.type == "GUILD_VOICE" && x.members.has(client.user.id))
        if (voiceChannelBot && voiceChannel.id != voiceChannelBot.id) {
            return message.reply("❌Il bot è momentaneamente in utilizzo da un altro utente, attendere il termine del processo...")
        }

        try {
            distube.stop(message)
                .catch(() => { return message.reply("🚫Non c'è alcun brano in esecuzione.") })
        } catch {
            return message.reply("🚫Non c'è alcun brano in riproduzione")
        }

        message.reply("✅La coda è stata messa in pausa correttamente.")
    }
})

distube.on("addSong", (queue, song) => {
    let embed = new Discord.MessageEmbed()
        .setTitle("Coda dei brani")
        .addField("Brano aggiunto in coda:", song.name)
        .setColor("RANDOM")

    queue.textChannel.send({ embeds: [embed] })
})

distube.on("playSong", (queue, song) => {
    let embed = new Discord.MessageEmbed()
        .setTitle("Inizializzazione...")
        .addField("Brano in riproduzione:", song.name)
        .addField("Richiesto:", song.user.toString())
        .setColor("RANDOM")

    queue.textChannel.send({ embeds: [embed] })
})

distube.on("searchNoResult", (message, query) => {
    message.reply("❌Errore: brano non trovato.")
})

client.login(process.env.token);
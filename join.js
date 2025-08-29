const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando join...")

module.exports = {
  name: "join",
  description: "Se une a un canal de voz",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("join")
    .setDescription("Se une a un canal de voz")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("Canal de voz al que unirse").addChannelTypes(ChannelType.GuildVoice),
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO JOIN EJECUTADO =====`)
    console.log(`🎵 [MUSIC] Usuario: ${context.user?.tag || context.author?.tag}`)
    console.log(`🎵 [MUSIC] Servidor: ${context.guild.name}`)
    console.log(`🎵 [MUSIC] Tipo: ${isInteraction ? 'Slash Command' : 'Mensaje'}`)

    const reply = async (options) => {
      if (isInteraction) {
        if (context.deferred || context.replied) {
          return context.editReply(options)
        }
        return context.reply(options)
      }
      return context.reply(options)
    }

    try {
      const guildId = context.guild.id
      const specifiedChannel = isInteraction
        ? context.options.getChannel("channel")
        : context.mentions.channels.first() ||
          (args[0] ? context.guild.channels.cache.get(args[0]) : null)
      const userVoiceChannel = context.member.voice.channel

      // Determine which channel to join
      const targetChannel = specifiedChannel || userVoiceChannel

      if (!targetChannel) {
        console.log(`❌ [MUSIC] Usuario no especificó canal ni está en uno`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("¡Necesitas estar en un canal de voz o especificar un canal para que me una!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      console.log(`🎵 [MUSIC] Canal objetivo: ${targetChannel.name}`)

      // Check if bot is already in a voice channel
      const currentQueue = musicManager.getGuildQueue(guildId)
      if (currentQueue && currentQueue.voiceChannel) {
        if (currentQueue.voiceChannel.id === targetChannel.id) {
          console.log(`⚠️ [MUSIC] Bot ya está en el canal ${targetChannel.name}`)
          const embed = new EmbedBuilder()
            .setColor("#ff9900")
            .setTitle("⚠️ Ya Conectado")
            .setDescription(`¡Ya estoy conectado a **${targetChannel.name}**!`)
            .setTimestamp()

          return await reply({ embeds: [embed], ephemeral: isInteraction })
        } else {
          console.log(`⚠️ [MUSIC] Bot ocupado en canal ${currentQueue.voiceChannel.name}`)
          const embed = new EmbedBuilder()
            .setColor("#ff9900")
            .setTitle("⚠️ Ya Conectado")
            .setDescription(
              `¡Ya estoy conectado a **${currentQueue.voiceChannel.name}**!\\nUsa \`/leave\` primero si quieres que me una a otro canal.`,
            )
            .setTimestamp()

          return await reply({ embeds: [embed], ephemeral: isInteraction })
        }
      }

      // Check bot permissions for the target channel
      const permissions = targetChannel.permissionsFor(context.client.user)
      if (!permissions.has(["Connect", "Speak"])) {
        console.log(`❌ [MUSIC] Bot sin permisos en canal ${targetChannel.name}`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription(`¡No tengo permiso para conectarme o hablar en **${targetChannel.name}**!`)
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      // Check if the channel is full
      if (targetChannel.userLimit > 0 && targetChannel.members.size >= targetChannel.userLimit) {
        const hasManageChannels = targetChannel.permissionsFor(context.client.user).has("ManageChannels")
        if (!hasManageChannels) {
          console.log(`❌ [MUSIC] Canal ${targetChannel.name} está lleno`)
          const embed = new EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("❌ Error")
            .setDescription(`¡**${targetChannel.name}** está lleno y no tengo permiso para eludir el límite!`)
            .setTimestamp()

          return await reply({ embeds: [embed], ephemeral: isInteraction })
        }
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      console.log(`🎵 [MUSIC] Intentando unirse al canal ${targetChannel.name}`)

      // Join the voice channel
      const joinResult = await musicManager.joinVoiceChannel(targetChannel, context.channel)

      if (joinResult.success) {
        console.log(`✅ [MUSIC] Bot conectado exitosamente a ${targetChannel.name}`)
        
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("✅ Conectado")
          .setDescription(`¡Me he conectado a **${targetChannel.name}**!`)
          .addFields(
            { name: "🎵 Estado", value: "Listo para reproducir música", inline: true },
            { name: "🔊 Volumen", value: "50%", inline: true },
            { name: "📝 Comandos", value: "Usa `/play` para reproducir música", inline: false }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }
        
        console.log(`🎵 [MUSIC] ===== COMANDO JOIN COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al unirse al canal: ${joinResult.error}`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription(`No pude conectarme a **${targetChannel.name}**: ${joinResult.error}`)
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }
    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando join:`, error)
      
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(`Ocurrió un error inesperado: ${error.message}`)
        .setTimestamp()

      if (isInteraction && context.deferred) {
        await context.editReply({ embeds: [embed], ephemeral: true })
      } else {
        await reply({ embeds: [embed], ephemeral: isInteraction })
      }
    }
  },

  async slashExecute(interaction, client) {
    await this.execute(interaction)
  }
}

console.log("🎵 [MUSIC] Comando join cargado correctamente")
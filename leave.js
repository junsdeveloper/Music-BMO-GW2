const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando leave...")

module.exports = {
  name: "leave",
  description: "Sale del canal de voz",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Sale del canal de voz"),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO LEAVE EJECUTADO =====`)
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
      const queue = musicManager.getGuildQueue(guildId)

      // Verificar si el bot está en un canal de voz
      if (!queue || !queue.voiceChannel) {
        console.log(`❌ [MUSIC] Bot no está en ningún canal de voz`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("⚠️ No Conectado")
          .setDescription("¡No estoy conectado a ningún canal de voz!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      const channelName = queue.voiceChannel.name
      console.log(`🎵 [MUSIC] Bot conectado a canal: ${channelName}`)

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Salir del canal de voz
      console.log(`🎵 [MUSIC] Saliendo del canal ${channelName}`)
      musicManager.leaveVoiceChannel(guildId)

      console.log(`✅ [MUSIC] Bot desconectado exitosamente de ${channelName}`)

      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("👋 Desconectado")
        .setDescription(`¡Me he desconectado de **${channelName}**!`)
        .addFields(
          { name: "🎵 Estado", value: "Desconectado del canal de voz", inline: true },
          { name: "📝 Cola", value: "Cola de música limpiada", inline: true }
        )
        .setTimestamp()

      if (isInteraction) {
        await context.editReply({ embeds: [embed] })
      } else {
        await context.reply({ embeds: [embed] })
      }

      console.log(`🎵 [MUSIC] ===== COMANDO LEAVE COMPLETADO EXITOSAMENTE =====`)

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando leave:`, error)
      
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

console.log("🎵 [MUSIC] Comando leave cargado correctamente")
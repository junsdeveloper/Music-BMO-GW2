const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando loop...")

module.exports = {
  name: "loop",
  description: "Establece el modo de loop para la música",
  cooldown: 3,

  data: new SlashCommandBuilder()
    .setName("loop")
    .setDescription("Establece el modo de loop para la música")
    .addStringOption((option) =>
      option
        .setName("modo")
        .setDescription("Modo de loop a establecer")
        .setRequired(true)
        .addChoices(
          { name: "❌ Desactivado", value: "off" },
          { name: "🔁 Canción", value: "song" },
          { name: "🔁 Cola", value: "queue" }
        )
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO LOOP EJECUTADO =====`)
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

      // Obtener el modo de loop solicitado
      let loopMode
      if (isInteraction) {
        loopMode = context.options.getString("modo")
      } else {
        const modeArg = args[0]?.toLowerCase()
        if (modeArg === "off" || modeArg === "desactivado") {
          loopMode = "off"
        } else if (modeArg === "song" || modeArg === "cancion") {
          loopMode = "song"
        } else if (modeArg === "queue" || modeArg === "cola") {
          loopMode = "queue"
        } else {
          loopMode = null
        }
      }

      // Si no se especificó modo, mostrar el actual
      if (!loopMode) {
        console.log(`🎵 [MUSIC] Mostrando modo de loop actual: ${queue.loop}`)
        
        const currentLoopText = queue.loop === "off" ? "❌ Desactivado" :
                               queue.loop === "song" ? "🔁 Canción" : "🔁 Cola"
        
        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🔁 Modo de Loop Actual")
          .setDescription(`El modo de loop actual es: **${currentLoopText}**`)
          .addFields(
            { name: "🎵 Estado", value: queue.isPlaying ? "Reproduciendo" : "Pausado", inline: true },
            { name: "📝 Canción", value: queue.currentSong?.title || "Ninguna", inline: true }
          )
          .setTimestamp()

        return await reply({ embeds: [embed] })
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando comando...`)
      }

      // Establecer el nuevo modo de loop
      console.log(`🎵 [MUSIC] Estableciendo modo de loop a: ${loopMode}`)
      const success = musicManager.setLoop(guildId, loopMode)

      if (success) {
        console.log(`✅ [MUSIC] Modo de loop establecido exitosamente a: ${loopMode}`)

        const loopText = loopMode === "off" ? "❌ Desactivado" :
                        loopMode === "song" ? "🔁 Canción" : "🔁 Cola"

        const description = loopMode === "off" ? "¡El loop se ha desactivado!" :
                           loopMode === "song" ? "¡La canción actual se repetirá infinitamente!" :
                           "¡La cola completa se repetirá infinitamente!"

        const embed = new EmbedBuilder()
          .setColor("#00ff00")
          .setTitle("🔁 Loop Configurado")
          .setDescription(description)
          .addFields(
            { name: "🔁 Modo", value: loopText, inline: true },
            { name: "🎵 Estado", value: queue.isPlaying ? "Reproduciendo" : "Pausado", inline: true },
            { name: "📝 Canción", value: queue.currentSong?.title || "Ninguna", inline: true }
          )
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }

        console.log(`🎵 [MUSIC] ===== COMANDO LOOP COMPLETADO EXITOSAMENTE =====`)
      } else {
        console.log(`❌ [MUSIC] Error al establecer el modo de loop`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Error")
          .setDescription("No se pudo establecer el modo de loop.")
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed], ephemeral: true })
        } else {
          await context.reply({ embeds: [embed] })
        }
      }

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando loop:`, error)
      
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

console.log("🎵 [MUSIC] Comando loop cargado correctamente")
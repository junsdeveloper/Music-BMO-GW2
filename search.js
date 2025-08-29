const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const musicManager = require("../utils/musicManager")
const ytSearch = require("yt-search")

console.log("🎵 [MUSIC] Cargando comando search...")

module.exports = {
  name: "search",
  description: "Busca canciones en YouTube",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Busca canciones en YouTube")
    .addStringOption((option) =>
      option.setName("query").setDescription("Término de búsqueda").setRequired(true)
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO SEARCH EJECUTADO =====`)
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
      const query = isInteraction ? context.options.getString("query") : args.join(" ")
      
      if (!query || query.trim().length === 0) {
        console.log(`❌ [MUSIC] Query de búsqueda vacía`)
        const embed = new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("❌ Query Vacía")
          .setDescription("¡Debes especificar un término de búsqueda!")
          .setTimestamp()

        return await reply({ embeds: [embed], ephemeral: isInteraction })
      }

      console.log(`🔍 [MUSIC] Buscando: ${query}`)

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando búsqueda...`)
      }

      // Realizar búsqueda en YouTube
      const searchResults = await ytSearch(query)
      
      if (!searchResults.videos || searchResults.videos.length === 0) {
        console.log(`❌ [MUSIC] No se encontraron resultados para: ${query}`)
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("🔍 Búsqueda Sin Resultados")
          .setDescription(`No se encontraron resultados para **${query}**`)
          .addFields({
            name: "💡 Consejos",
            value: "• Intenta con términos más específicos\n• Verifica la ortografía\n• Usa palabras clave diferentes",
            inline: false
          })
          .setTimestamp()

        if (isInteraction) {
          await context.editReply({ embeds: [embed] })
        } else {
          await context.reply({ embeds: [embed] })
        }
        return
      }

      // Limitar a 10 resultados
      const videos = searchResults.videos.slice(0, 10)
      console.log(`✅ [MUSIC] Encontrados ${videos.length} resultados`)

      // Crear embed de resultados
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("🔍 Resultados de Búsqueda")
        .setDescription(`Resultados para **${query}**`)
        .setTimestamp()

      // Añadir campos para cada video
      videos.forEach((video, index) => {
        const duration = video.duration ? musicManager.formatDuration(video.duration.seconds) : "Desconocida"
        const title = video.title.length > 50 ? video.title.substring(0, 47) + "..." : video.title
        
        embed.addFields({
          name: `${index + 1}. ${title}`,
          value: `👤 ${video.author.name} • ⏱️ ${duration} • 📺 [Ver en YouTube](${video.url})`,
          inline: false
        })
      })

      // Crear botones para selección
      const rows = []
      for (let i = 0; i < Math.ceil(videos.length / 5); i++) {
        const row = new ActionRowBuilder()
        const startIndex = i * 5
        const endIndex = Math.min(startIndex + 5, videos.length)
        
        for (let j = startIndex; j < endIndex; j++) {
          const button = new ButtonBuilder()
            .setCustomId(`search_${context.user?.id || context.author?.id}_${j}`)
            .setLabel(`${j + 1}`)
            .setStyle(ButtonStyle.Primary)
          
          row.addComponents(button)
        }
        
        rows.push(row)
      }

      // Añadir botón de cancelar
      const cancelRow = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`search_cancel_${context.user?.id || context.author?.id}`)
            .setLabel("❌ Cancelar")
            .setStyle(ButtonStyle.Danger)
        )
      rows.push(cancelRow)

      // Enviar resultados
      if (isInteraction) {
        await context.editReply({ 
          embeds: [embed], 
          components: rows 
        })
      } else {
        await context.reply({ 
          embeds: [embed], 
          components: rows 
        })
      }

      console.log(`🎵 [MUSIC] ===== COMANDO SEARCH COMPLETADO EXITOSAMENTE =====`)

      // Configurar timeout para limpiar botones
      setTimeout(() => {
        try {
          const disabledRows = rows.map(row => {
            const newRow = ActionRowBuilder.from(row)
            newRow.components.forEach(component => {
              if (component instanceof ButtonBuilder) {
                component.setDisabled(true)
              }
            })
            return newRow
          })

          if (isInteraction) {
            context.editReply({ components: disabledRows }).catch(() => {})
          } else {
            context.editReply({ components: disabledRows }).catch(() => {})
          }
        } catch (error) {
          console.log(`⚠️ [MUSIC] No se pudieron deshabilitar los botones de búsqueda`)
        }
      }, 60000) // 1 minuto

    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando search:`, error)
      
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("❌ Error")
        .setDescription(`Ocurrió un error durante la búsqueda: ${error.message}`)
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
  },

  // Método para manejar la selección de búsqueda
  async handleSearchSelection(interaction, videoIndex, videos, query) {
    try {
      console.log(`🎵 [MUSIC] Usuario seleccionó video ${videoIndex + 1} de búsqueda`)

      const selectedVideo = videos[videoIndex]
      if (!selectedVideo) {
        console.log(`❌ [MUSIC] Video seleccionado no válido`)
        await interaction.reply({
          content: "❌ Video seleccionado no válido.",
          ephemeral: true
        })
        return
      }

      // Verificar si el usuario está en un canal de voz
      const voiceChannel = interaction.member.voice.channel
      if (!voiceChannel) {
        console.log(`❌ [MUSIC] Usuario no está en canal de voz`)
        await interaction.reply({
          content: "❌ Debes estar en un canal de voz para usar este comando.",
          ephemeral: true
        })
        return
      }

      // Verificar permisos del bot
      const permissions = voiceChannel.permissionsFor(interaction.client.user)
      if (!permissions.has(["Connect", "Speak"])) {
        console.log(`❌ [MUSIC] Bot sin permisos en canal ${voiceChannel.name}`)
        await interaction.reply({
          content: `❌ No tengo permisos para conectarme o hablar en **${voiceChannel.name}**`,
          ephemeral: true
        })
        return
      }

      await interaction.deferReply()

      const guildId = interaction.guild.id
      
      // Unirse al canal de voz si no está conectado
      let connection = musicManager.connections.get(guildId)
      if (!connection) {
        console.log(`🎵 [MUSIC] Bot no conectado, uniéndose al canal ${voiceChannel.name}`)
        const joinResult = await musicManager.joinVoiceChannel(voiceChannel, interaction.channel)
        
        if (!joinResult.success) {
          console.log(`❌ [MUSIC] Error al unirse al canal: ${joinResult.error}`)
          await interaction.editReply({
            content: `❌ Error al unirse al canal de voz: ${joinResult.error}`,
            ephemeral: true
          })
          return
        }
        connection = joinResult.connection
      }

      // Crear objeto de canción
      const song = {
        title: selectedVideo.title,
        url: selectedVideo.url,
        duration: musicManager.formatDuration(selectedVideo.duration.seconds),
        thumbnail: selectedVideo.thumbnail,
        channel: selectedVideo.author.name,
        durationSeconds: selectedVideo.duration.seconds
      }

      // Agregar a la cola
      const addResult = await musicManager.addToQueue(guildId, song, interaction.user)
      
      if (!addResult.success) {
        console.log(`❌ [MUSIC] Error al agregar a la cola: ${addResult.error}`)
        await interaction.editReply({
          content: `❌ Error al agregar la canción a la cola: ${addResult.error}`,
          ephemeral: true
        })
        return
      }

      console.log(`✅ [MUSIC] Canción de búsqueda agregada exitosamente`)

      // Crear embed de confirmación
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("✅ Canción Agregada")
        .setDescription(`**${song.title}**`)
        .setThumbnail(song.thumbnail)
        .addFields(
          { name: "⏱️ Duración", value: song.duration, inline: true },
          { name: "👤 Canal", value: song.channel, inline: true },
          { name: "📊 Posición", value: `#${addResult.position}`, inline: true },
          { name: "🔗 URL", value: `[Ver en YouTube](${song.url})`, inline: false }
        )
        .setFooter({ text: `Solicitado por ${interaction.user.tag}` })
        .setTimestamp()

      // Si es la primera canción, mostrar mensaje especial
      if (addResult.position === 1) {
        embed.setTitle("🎵 Reproduciendo ahora")
        embed.setDescription(`**${song.title}**\n\n*Iniciando reproducción...*`)
      }

      await interaction.editReply({ embeds: [embed] })

      // Deshabilitar todos los botones
      const disabledComponents = interaction.message.components.map(row => {
        const newRow = ActionRowBuilder.from(row)
        newRow.components.forEach(component => {
          if (component instanceof ButtonBuilder) {
            component.setDisabled(true)
          }
        })
        return newRow
      })

      await interaction.message.edit({ components: disabledComponents })

    } catch (error) {
      console.error(`❌ [MUSIC] Error en handleSearchSelection:`, error)
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ Error inesperado: ${error.message}`,
          ephemeral: true
        })
      } else {
        await interaction.editReply({
          content: `❌ Error inesperado: ${error.message}`,
          ephemeral: true
        })
      }
    }
  }
}

console.log("🎵 [MUSIC] Comando search cargado correctamente")
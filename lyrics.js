const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const musicManager = require("../utils/musicManager")

console.log("🎵 [MUSIC] Cargando comando lyrics...")

// Función mejorada para buscar letras usando múltiples APIs
async function searchLyrics(songTitle, artist) {
  try {
    console.log(`🔍 [LYRICS] Buscando letra para: ${songTitle} - ${artist}`)
    
    // API 1: Genius (más confiable)
    try {
      const geniusResponse = await fetch(
        `https://api.genius.com/search?q=${encodeURIComponent(`${artist} ${songTitle}`)}`,
        {
          headers: {
            'Authorization': 'Bearer YOUR_GENIUS_TOKEN' // Necesitarás un token de Genius
          }
        }
      )
      
      if (geniusResponse.ok) {
        const data = await geniusResponse.json()
        if (data.response.hits.length > 0) {
          const song = data.response.hits[0].result
          console.log(`✅ [LYRICS] Letra encontrada en Genius: ${song.title}`)
          
          // Aquí obtendrías la letra completa usando la URL de la canción
          return {
            success: true,
            lyrics: `Letra encontrada en Genius para "${song.title}"\n\nPara ver la letra completa, visita: ${song.url}`,
            source: "Genius",
            url: song.url
          }
        }
      }
    } catch (geniusError) {
      console.log(`⚠️ [LYRICS] Error con Genius API: ${geniusError.message}`)
    }

    // API 2: Musixmatch (fallback)
    try {
      const musixmatchResponse = await fetch(
        `https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?q_track=${encodeURIComponent(songTitle)}&q_artist=${encodeURIComponent(artist)}&apikey=YOUR_MUSIXMATCH_KEY`
      )
      
      if (musixmatchResponse.ok) {
        const data = await musixmatchResponse.json()
        if (data.message.body.lyrics && data.message.body.lyrics.lyrics_body) {
          console.log(`✅ [LYRICS] Letra encontrada en Musixmatch`)
          return {
            success: true,
            lyrics: data.message.body.lyrics.lyrics_body,
            source: "Musixmatch"
          }
        }
      }
    } catch (musixmatchError) {
      console.log(`⚠️ [LYRICS] Error con Musixmatch API: ${musixmatchError.message}`)
    }

    // API 3: Lyrics.ovh (último recurso)
    try {
      const lyricsOvResponse = await fetch(
        `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(songTitle)}`
      )
      
      if (lyricsOvResponse.ok) {
        const data = await lyricsOvResponse.json()
        if (data.lyrics && !data.error) {
          console.log(`✅ [LYRICS] Letra encontrada en Lyrics.ovh`)
          return {
            success: true,
            lyrics: data.lyrics,
            source: "Lyrics.ovh"
          }
        }
      }
    } catch (lyricsOvError) {
      console.log(`⚠️ [LYRICS] Error con Lyrics.ovh API: ${lyricsOvError.message}`)
    }

    // Si ninguna API funcionó
    console.log(`❌ [LYRICS] No se encontró letra en ninguna API`)
    return {
      success: false,
      message: "No se encontró la letra para esta canción en ninguna de las APIs disponibles."
    }

  } catch (error) {
    console.error(`❌ [LYRICS] Error general en búsqueda de letras:`, error)
    return {
      success: false,
      message: "Ocurrió un error al buscar la letra."
    }
  }
}

module.exports = {
  name: "lyrics",
  description: "Obtiene la letra de la canción actual o busca la letra de una canción específica",
  cooldown: 5,

  data: new SlashCommandBuilder()
    .setName("lyrics")
    .setDescription("Obtiene la letra de la canción actual o busca la letra de una canción específica")
    .addStringOption((option) =>
      option.setName("song").setDescription("Nombre de la canción para buscar la letra (formato: Artista - Título)"),
    ),

  async execute(interactionOrMessage, args) {
    const isInteraction = !!interactionOrMessage.isChatInputCommand
    const context = interactionOrMessage

    console.log(`🎵 [MUSIC] ===== COMANDO LYRICS EJECUTADO =====`)
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
      const songQuery = isInteraction ? context.options.getString("song") : args?.length > 0 ? args.join(" ") : null
      let songTitle, artist

      if (songQuery) {
        // Usuario especificó una canción para buscar
        console.log(`🔍 [LYRICS] Búsqueda específica: ${songQuery}`)
        
        const parts = songQuery.split(" - ")
        if (parts.length >= 2) {
          artist = parts[0].trim()
          songTitle = parts[1].trim()
        } else {
          songTitle = songQuery.trim()
          artist = "Artista Desconocido"
        }
        
        console.log(`🔍 [LYRICS] Artista: ${artist}, Título: ${songTitle}`)
      } else {
        // Obtener canción actual
        console.log(`🔍 [LYRICS] Obteniendo canción actual`)
        
        const guildId = context.guild.id
        const queueInfo = musicManager.getQueueInfo(guildId)

        if (!queueInfo || !queueInfo.currentSong) {
          console.log(`❌ [LYRICS] No hay canción reproduciéndose`)
          
          const embed = new EmbedBuilder()
            .setColor("#ff9900")
            .setTitle("🎵 Ninguna Canción Reproduciéndose")
            .setDescription("¡No se está reproduciendo ninguna canción! Usa `/lyrics <nombre de la canción>` para buscar una letra específica.")
            .addFields({
              name: "💡 Ejemplo",
              value: "`/lyrics Never Gonna Give You Up - Rick Astley`",
            })
            .setTimestamp()

          return await reply({ embeds: [embed], ephemeral: isInteraction })
        }

        songTitle = queueInfo.currentSong.title
        artist = queueInfo.currentSong.channel || "Artista Desconocido"
        
        console.log(`🔍 [LYRICS] Canción actual: ${songTitle} - ${artist}`)
      }

      if (isInteraction) {
        await context.deferReply()
        console.log(`🎵 [MUSIC] Respuesta diferida, procesando búsqueda de letra...`)
      }

      // Buscar letra
      console.log(`🔍 [LYRICS] Iniciando búsqueda de letra...`)
      const lyricsResult = await searchLyrics(songTitle, artist)

      if (lyricsResult.success) {
        console.log(`✅ [LYRICS] Letra encontrada exitosamente`)
        
        const queueInfo = musicManager.getQueueInfo(context.guild.id)
        const songUrl = songQuery ? null : queueInfo?.currentSong?.url
        
        // Dividir letra en chunks si es muy larga para Discord
        const maxLength = 4096
        const lyrics = lyricsResult.lyrics

        if (lyrics.length <= maxLength) {
          // Una sola letra
          const embed = new EmbedBuilder()
            .setColor("#00ff00")
            .setTitle("🎤 Letra Encontrada")
            .setDescription(`**${songTitle}** - ${artist}`)
            .addFields({
              name: "📝 Letra",
              value: lyrics,
            })
            .setFooter({ text: `Fuente: ${lyricsResult.source || "Desconocida"}` })
            .setTimestamp()

          if (lyricsResult.url) {
            embed.addFields({
              name: "🔗 Enlace",
              value: `[Ver letra completa](${lyricsResult.url})`,
              inline: false
            })
          }

          await reply({ embeds: [embed] })
        } else {
          // Dividir en múltiples embeds
          console.log(`📄 [LYRICS] Letra muy larga, dividiendo en ${Math.ceil(lyrics.length / maxLength)} partes`)
          
          const chunks = []
          let currentChunk = ""

          const lines = lyrics.split("\n")
          for (const line of lines) {
            if (currentChunk.length + line.length + 1 > maxLength) {
              chunks.push(currentChunk)
              currentChunk = line
            } else {
              currentChunk += (currentChunk ? "\n" : "") + line
            }
          }
          if (currentChunk) chunks.push(currentChunk)

          const embeds = chunks.map((chunk, index) => {
            const embed = new EmbedBuilder()
              .setColor("#00ff00")
              .setDescription(chunk)

            if (index === 0) {
              embed.setTitle("🎤 Letra Encontrada")
              embed.addFields({
                name: "🎵 Canción",
                value: `**${songTitle}** - ${artist}`,
              })
            }

            if (index === chunks.length - 1) {
              embed.setFooter({
                text: `Fuente: ${lyricsResult.source || "Desconocida"} | Página ${index + 1}/${chunks.length}`,
              })
              embed.setTimestamp()
            } else {
              embed.setFooter({ text: `Página ${index + 1}/${chunks.length}` })
            }

            return embed
          })

          // Enviar primer embed, luego los demás como follow-ups
          await reply({ embeds: [embeds[0]] })

          for (let i = 1; i < embeds.length; i++) {
            await context.followUp({ embeds: [embeds[i]] })
          }
        }

        console.log(`🎵 [MUSIC] ===== COMANDO LYRICS COMPLETADO EXITOSAMENTE ====="`)
      } else {
        // No se encontró letra o ocurrió un error
        console.log(`❌ [LYRICS] No se encontró letra: ${lyricsResult.message}`)
        
        const embed = new EmbedBuilder()
          .setColor("#ff9900")
          .setTitle("🎤 Letra no Encontrada")
          .setDescription(`**${songTitle}** - ${artist}`)
          .addFields({
            name: "❌ Resultado",
            value: lyricsResult.message,
          })
          .addFields({
            name: "💡 Consejos",
            value:
              "• Intenta buscar con el formato: `Artista - Título de la Canción`\n• Revisa la ortografía e intenta diferentes variaciones\n• Es posible que algunas canciones no tengan la letra disponible\n• Algunas APIs pueden estar temporalmente no disponibles",
          })
          .setTimestamp()

        await reply({ embeds: [embed], ephemeral: isInteraction })
      }
    } catch (error) {
      console.error(`❌ [MUSIC] Error en comando lyrics:`, error)
      
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

console.log("🎵 [MUSIC] Comando lyrics cargado correctamente")
const User = require("../models/User")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// ─── Language display names for the PDF ────────────────────────────────────────
const LANGUAGE_LABELS = {
  de: { name: "Gjuhës Gjermane", flag: "🇩🇪" },
  en: { name: "Gjuhës Angleze",  flag: "🇬🇧" },
  fr: { name: "Gjuhës Frënge",   flag: "🇫🇷" },
  tr: { name: "Gjuhës Turke",    flag: "🇹🇷" },
  it: { name: "Gjuhës Italiane", flag: "🇮🇹" },
}

const VALID_LEVELS    = ["A1", "A2", "B1", "B2", "C1", "C2"]
const VALID_LANGUAGES = ["de", "en", "fr", "tr", "it"]

// ─── Serial number ─────────────────────────────────────────────────────────────
const generateSerialNumber = (level, language = "de") => {
  const year       = new Date().getFullYear()
  const month      = String(new Date().getMonth() + 1).padStart(2, "0")
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `GLC-${year}${month}-${language.toUpperCase()}-${level}-${randomCode}`
}

// ─── PDF generator ─────────────────────────────────────────────────────────────
const generateCertificatePDF = async (user, level, serialNumber, language = "de") => {
  return new Promise((resolve, reject) => {
    try {
      const certificatesDir = path.join(__dirname, "../public/certificates")
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true })
      }

      const fileName = `certificate_${user._id}_${language}_${level}_${Date.now()}.pdf`
      const filePath = path.join(certificatesDir, fileName)
      const doc      = new PDFDocument({ size: "A4", layout: "landscape" })
      const stream   = fs.createWriteStream(filePath)

      doc.pipe(stream)

      doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 }

      // Background
      doc.rect(0, 0, 842, 595).fill("#0f1419")
      doc.rect(20, 20, 802, 555).fill("#ffffff")

      // Borders
      doc.strokeColor("#d4af37").lineWidth(3).rect(35, 35, 772, 525).stroke()
      doc.strokeColor("#b8960f").lineWidth(1).rect(45, 45, 752, 505).stroke()

      // Corner flourishes
      doc.fillColor("#d4af37")
      doc.moveTo(55, 55).lineTo(55, 85).lineTo(52, 85).lineTo(52, 52).lineTo(85, 52).lineTo(85, 55).fill()
      doc.moveTo(787, 55).lineTo(787, 85).lineTo(790, 85).lineTo(790, 52).lineTo(757, 52).lineTo(757, 55).fill()
      doc.moveTo(55, 540).lineTo(55, 510).lineTo(52, 510).lineTo(52, 543).lineTo(85, 543).lineTo(85, 540).fill()
      doc.moveTo(787, 540).lineTo(787, 510).lineTo(790, 510).lineTo(790, 543).lineTo(757, 543).lineTo(757, 540).fill()

      // Logo
      const logoSize = 85
      const logoX    = (842 - logoSize) / 2
      const logoY    = 70

      doc.strokeColor("#d4af37").lineWidth(2)
        .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3).stroke()

      doc.save()
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip()
      doc.image(path.join(__dirname, "../public/images/logo.png"), logoX, logoY, { width: logoSize })
      doc.restore()

      // Divider under logo
      doc.strokeColor("#d4af37").lineWidth(1)
      doc.moveTo(321, 175).lineTo(521, 175).stroke()

      // Title
      doc.fontSize(42).fillColor("#0f1419").font("Times-Bold")
        .text("CERTIFIKATË E PËRFUNDIMIT", 0, 195, { align: "center", width: 842, characterSpacing: 1 })

      // Divider under title
      doc.strokeColor("#d4af37").lineWidth(1)
      doc.moveTo(321, 245).lineTo(521, 245).stroke()

      // Intro
      doc.fontSize(14).fillColor("#4a5568").font("Times-Italic")
        .text("Me kënaqësi vërtetojmë se", 0, 265, { align: "center", width: 842 })

      // User name
      doc.fontSize(52).fillColor("#d4af37").font("Times-Bold")
        .text(`${user.emri} ${user.mbiemri}`, 0, 295, { align: "center", width: 842, characterSpacing: 0.5 })

      // Accent under name
      doc.fillColor("#d4af37")
      doc.moveTo(371, 355).lineTo(421, 358).lineTo(471, 355).fill()

      // Language-aware body text
      const languageLabel = LANGUAGE_LABELS[language]?.name || "Gjuhës Gjermane"
      doc.fontSize(16).fillColor("#4a5568").font("Times-Roman")
        .text(`ka përfunduar me sukses programin e ${languageLabel}`, 0, 375, { align: "center", width: 842 })

      // Level
      doc.fontSize(72).fillColor("#0f1419").font("Times-Bold")
        .text(level, 0, 410, { align: "center", width: 842, characterSpacing: 2 })

      // Decorative dashes around level
      doc.strokeColor("#d4af37").lineWidth(2)
      doc.moveTo(300, 455).lineTo(370, 455).stroke()
      doc.moveTo(472, 455).lineTo(542, 455).stroke()

      // Date
      const issueDate = new Date().toLocaleDateString("sq-AL", {
        day: "numeric", month: "long", year: "numeric",
      })
      doc.fontSize(15).fillColor("#2d3748").font("Times-Roman")
        .text(issueDate, 0, 488, { align: "center", width: 842 })

      // Signature line
      doc.strokeColor("#2d3748").lineWidth(1)
      doc.moveTo(321, 530).lineTo(521, 530).stroke()

      doc.fontSize(11).fillColor("#4a5568").font("Times-Italic")
        .text("Gjuha Gjermane", 0, 538, { align: "center", width: 842 })

      doc.end()

      stream.on("finish", () => resolve(`/certificates/${fileName}`))
      stream.on("error",  (error) => reject(error))
    } catch (error) {
      reject(error)
    }
  })
}

// ─── Issue certificate (language-aware) ────────────────────────────────────────
exports.checkAndIssueCertificate = async (req, res) => {
  try {
    const userId   = req.user.id
    const language = req.body.language || "de"

    if (!VALID_LANGUAGES.includes(language)) {
      return res.status(400).json({ success: false, message: "Gjuhë e pavlefshme" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    // We need a level-per-language concept.
    // Strategy: look at UserTestHistory for the highest passed level in this language.
    // Since User.level only stores the German level, we query history directly.
    const { UserTestHistory } = require("../models/Test")

    // Find all passed levels for this user + language, ordered by CEFR index
    const passedLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]
    const passedHistory = await UserTestHistory.find({
      userId: String(userId),
      language,
      passed: true,
    }).select("level")

    const passedSet = new Set(passedHistory.map((h) => h.level))

    // Highest consecutive passed level
    let highestLevel = null
    for (const lvl of passedLevels) {
      if (passedSet.has(lvl)) highestLevel = lvl
      else break
    }

    // For German (de) also accept user.level as fallback (backward compat)
    if (!highestLevel && language === "de" && user.level) {
      highestLevel = user.level
    }

    if (!highestLevel) {
      return res.status(200).json({
        success: false,
        message: "Nuk ka nivel të kaluar për këtë gjuhë",
      })
    }

    // Check if certificate already exists for this level+language combo
    const existingCertificate = user.certificates.find(
      (cert) => cert.level === highestLevel && (cert.language || "de") === language,
    )

    if (existingCertificate) {
      return res.status(200).json({
        success: true,
        message: "Certifikata tashmë ekziston për këtë nivel dhe gjuhë",
        certificate: existingCertificate,
      })
    }

    const serialNumber = generateSerialNumber(highestLevel, language)
    const filePath     = await generateCertificatePDF(user, highestLevel, serialNumber, language)

    user.certificates.push({
      level:        highestLevel,
      language:     language,
      filePath:     filePath,
      serialNumber: serialNumber,
      issuedAt:     new Date(),
    })

    await user.save()

    const newCertificate = user.certificates[user.certificates.length - 1]

    res.status(201).json({
      success: true,
      message: "Certifikata u krijua me sukses",
      certificate: newCertificate,
    })
  } catch (error) {
    console.error("[Certificate] Error issuing certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në krijimin e certifikatës", error: error.message })
  }
}

// ─── Get all certificates for user ─────────────────────────────────────────────
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id
    const user   = await User.findById(userId).select("certificates emri mbiemri level")

    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    // Return all certs — frontend filters by language
    res.status(200).json({
      success: true,
      certificates: user.certificates,
    })
  } catch (error) {
    console.error("[Certificate] Error fetching certificates:", error)
    res.status(500).json({ success: false, message: "Gabim në marrjen e certifikatave", error: error.message })
  }
}

// ─── Download certificate (generated on-the-fly) ──────────────────────────────
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params
    const userId            = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const certificate = user.certificates.id(certificateId)
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certifikata nuk u gjet" })
    }

    const lang     = certificate.language || "de"
    const langName = LANGUAGE_LABELS[lang]?.name?.split(" ")[1] || "Gjermane"
    const filename = `Certifikata_${langName}_${certificate.level}_${user.emri}_${user.mbiemri}.pdf`

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)

    // Generate PDF directly into the response stream — no disk dependency
    const doc = new PDFDocument({ size: "A4", layout: "landscape" })
    doc.pipe(res)

    doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 }

    // Background
    doc.rect(0, 0, 842, 595).fill("#0f1419")
    doc.rect(20, 20, 802, 555).fill("#ffffff")

    // Borders
    doc.strokeColor("#d4af37").lineWidth(3).rect(35, 35, 772, 525).stroke()
    doc.strokeColor("#b8960f").lineWidth(1).rect(45, 45, 752, 505).stroke()

    // Corner flourishes
    doc.fillColor("#d4af37")
    doc.moveTo(55, 55).lineTo(55, 85).lineTo(52, 85).lineTo(52, 52).lineTo(85, 52).lineTo(85, 55).fill()
    doc.moveTo(787, 55).lineTo(787, 85).lineTo(790, 85).lineTo(790, 52).lineTo(757, 52).lineTo(757, 55).fill()
    doc.moveTo(55, 540).lineTo(55, 510).lineTo(52, 510).lineTo(52, 543).lineTo(85, 543).lineTo(85, 540).fill()
    doc.moveTo(787, 540).lineTo(787, 510).lineTo(790, 510).lineTo(790, 543).lineTo(757, 543).lineTo(757, 540).fill()

    // Logo
    const logoSize = 85
    const logoX    = (842 - logoSize) / 2
    const logoY    = 70
    const logoPath = path.join(__dirname, "../public/images/logo.png")

    doc.strokeColor("#d4af37").lineWidth(2)
      .circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3).stroke()

    if (fs.existsSync(logoPath)) {
      doc.save()
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip()
      doc.image(logoPath, logoX, logoY, { width: logoSize })
      doc.restore()
    }

    // Divider under logo
    doc.strokeColor("#d4af37").lineWidth(1)
    doc.moveTo(321, 175).lineTo(521, 175).stroke()

    // Title
    doc.fontSize(42).fillColor("#0f1419").font("Times-Bold")
      .text("CERTIFIKATË E PËRFUNDIMIT", 0, 195, { align: "center", width: 842, characterSpacing: 1 })

    // Divider under title
    doc.strokeColor("#d4af37").lineWidth(1)
    doc.moveTo(321, 245).lineTo(521, 245).stroke()

    // Intro
    doc.fontSize(14).fillColor("#4a5568").font("Times-Italic")
      .text("Me kënaqësi vërtetojmë se", 0, 265, { align: "center", width: 842 })

    // User name
    doc.fontSize(52).fillColor("#d4af37").font("Times-Bold")
      .text(`${user.emri} ${user.mbiemri}`, 0, 295, { align: "center", width: 842, characterSpacing: 0.5 })

    // Accent under name
    doc.fillColor("#d4af37")
    doc.moveTo(371, 355).lineTo(421, 358).lineTo(471, 355).fill()

    // Language-aware body text
    const languageLabel = LANGUAGE_LABELS[lang]?.name || "Gjuhës Gjermane"
    doc.fontSize(16).fillColor("#4a5568").font("Times-Roman")
      .text(`ka përfunduar me sukses programin e ${languageLabel}`, 0, 375, { align: "center", width: 842 })

    // Level
    doc.fontSize(72).fillColor("#0f1419").font("Times-Bold")
      .text(certificate.level, 0, 410, { align: "center", width: 842, characterSpacing: 2 })

    // Decorative dashes around level
    doc.strokeColor("#d4af37").lineWidth(2)
    doc.moveTo(300, 455).lineTo(370, 455).stroke()
    doc.moveTo(472, 455).lineTo(542, 455).stroke()

    // Date
    const issueDate = new Date(certificate.issuedAt).toLocaleDateString("sq-AL", {
      day: "numeric", month: "long", year: "numeric",
    })
    doc.fontSize(15).fillColor("#2d3748").font("Times-Roman")
      .text(issueDate, 0, 488, { align: "center", width: 842 })

    // Signature line
    doc.strokeColor("#2d3748").lineWidth(1)
    doc.moveTo(321, 530).lineTo(521, 530).stroke()

    doc.fontSize(11).fillColor("#4a5568").font("Times-Italic")
      .text("Gjuha Gjermane", 0, 538, { align: "center", width: 842 })

    doc.end()
  } catch (error) {
    console.error("[Certificate] Error downloading certificate:", error)
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Gabim në shkarkimin e certifikatës" })
    }
  }
}

// ─── Admin: generate certificate for specific level+language ───────────────────
exports.generateCertificateForLevel = async (req, res) => {
  try {
    const { userId, level, language = "de" } = req.body

    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({ success: false, message: "Nivel i pavlefshëm" })
    }
    if (!VALID_LANGUAGES.includes(language)) {
      return res.status(400).json({ success: false, message: "Gjuhë e pavlefshme" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const existingCertificate = user.certificates.find(
      (cert) => cert.level === level && (cert.language || "de") === language,
    )
    if (existingCertificate) {
      return res.status(400).json({ success: false, message: "Certifikata tashmë ekziston për këtë nivel dhe gjuhë" })
    }

    const serialNumber = generateSerialNumber(level, language)
    const filePath     = await generateCertificatePDF(user, level, serialNumber, language)

    user.certificates.push({
      level,
      language,
      filePath,
      serialNumber,
      issuedAt: new Date(),
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: "Certifikata u krijua me sukses",
      certificate: user.certificates[user.certificates.length - 1],
    })
  } catch (error) {
    console.error("[Certificate] Error generating certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në krijimin e certifikatës", error: error.message })
  }
}
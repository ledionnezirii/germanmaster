const User = require("../models/User")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

const generateSerialNumber = (level, userId) => {
  const year = new Date().getFullYear()
  const userIdShort = userId.toString().slice(-4).toUpperCase()
  const randomCode = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${year}-${level}-${userIdShort}-${randomCode}`
}

// Helper function to generate certificate PDF
const generateCertificatePDF = async (user, level, serialNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const certificatesDir = path.join(__dirname, "../public/certificates")
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true })
      }

      const fileName = `certificate_${user._id}_${level}_${Date.now()}.pdf`
      const filePath = path.join(certificatesDir, fileName)
      const doc = new PDFDocument({ size: "A4", layout: "landscape" })
      const stream = fs.createWriteStream(filePath)

      doc.pipe(stream)

      // Set page margins to zero
      doc.page.margins = { top: 0, bottom: 0, left: 0, right: 0 }

      // Background colors and borders
      doc.rect(0, 0, 842, 595).fill("#1a2332")
      doc.rect(15, 15, 812, 565).fill("#f5f1e8")
      doc.strokeColor("#c9a961").lineWidth(2).rect(45, 35, 752, 525).stroke()

      // Decorative corners
      doc.fillColor("#c9a961")
      // Top left corner
      doc.moveTo(50, 60).bezierCurveTo(55, 50, 60, 45, 70, 50).bezierCurveTo(60, 55, 55, 60, 50, 70).fill()
      // Top right corner
      doc.moveTo(792, 60).bezierCurveTo(787, 50, 782, 45, 772, 50).bezierCurveTo(782, 55, 787, 60, 792, 70).fill()
      // Bottom left corner
      doc.moveTo(50, 535).bezierCurveTo(55, 545, 60, 550, 70, 545).bezierCurveTo(60, 540, 55, 535, 50, 525).fill()
      // Bottom right corner
      doc
        .moveTo(792, 535)
        .bezierCurveTo(787, 545, 782, 550, 772, 545)
        .bezierCurveTo(782, 540, 787, 535, 792, 525)
        .fill()

      const logoSize = 100 // Reduced from 140 to fit better
      const logoX = (842 - logoSize) / 2 // center horizontally
      const logoY = 60 // moved down from 10 to prevent overflow at top

      doc.save()
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip()
      doc.image(path.join(__dirname, "../public/images/logo.png"), logoX, logoY, { width: logoSize })
      doc.restore()

      doc.fontSize(38).fillColor("#1a2332").font("Times-Bold").text("CERTIFIKATË E PËRFUNDIMIT", 0, 170, {
        align: "center",
        width: 842,
      })

      // Intro text
      doc
        .fontSize(13)
        .fillColor("#4a4a4a")
        .font("Times-Roman")
        .text("Me anë të kësaj certifikatë vërtetohet se", 0, 220, {
          align: "center",
          width: 842,
        })

      // User name
      doc.fontSize(48).fillColor("#c9a961").font("Times-Bold").text(`${user.emri} ${user.mbiemri}`, 0, 255, {
        align: "center",
        width: 842,
      })

      // Completion text
      doc.fontSize(15).fillColor("#4a4a4a").font("Times-Roman").text("ka përfunduar me sukses kursin e", 0, 315, {
        align: "center",
        width: 842,
      })

      // Course name
      doc.fontSize(26).fillColor("#1a2332").font("Times-Bold").text("Gjuha Gjermane", 0, 345, {
        align: "center",
        width: 842,
      })

      // Level
      doc.fontSize(80).fillColor("#c9a961").font("Times-Bold").text(level, 0, 385, {
        align: "center",
        width: 842,
      })

      // Issue date (moved a bit up)
      const issueDate = new Date().toLocaleDateString("sq-AL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      doc.fontSize(14).fillColor("#4a4a4a").font("Times-Roman").text(`${issueDate}`, 0, 475, {
        align: "center",
        width: 842,
      })

      doc.fontSize(11).fillColor("#6a6a6a").font("Times-Italic").text("Data e Lëshimit", 0, 495, {
        align: "center",
        width: 842,
      })

      // Footer block (moved a bit up)
      doc.rect(350, 530, 142, 20).fill("#e8d68a")
      doc.fontSize(11).fillColor("#4a4a4a").font("Times-Roman").text("German Learn Website", 350, 535, {
        width: 142,
        align: "center",
      })

      // Serial number (moved up to avoid page break)
      doc.fontSize(10).fillColor("#d97706").font("Times-Roman").text(`Nr. Serie: ${serialNumber}`, 0, 560, {
        align: "right",
        width: 792,
      })

      doc.end()

      stream.on("finish", () => {
        resolve(`/certificates/${fileName}`)
      })

      stream.on("error", (error) => {
        reject(error)
      })
    } catch (error) {
      reject(error)
    }
  })
}

// Check and issue certificate when user levels up
exports.checkAndIssueCertificate = async (req, res) => {
  try {
    console.log("[v0] Issuing certificate for user:", req.user?.id)

    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      console.log("[v0] User not found:", userId)
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const currentLevel = user.level
    console.log("[v0] User current level:", currentLevel)

    if (currentLevel === "A1") {
      return res.status(200).json({
        success: false,
        message: "Certifikata nuk lëshohet për nivelin A1",
      })
    }

    const existingCertificate = user.certificates.find((cert) => cert.level === currentLevel)

    if (existingCertificate) {
      console.log("[v0] Certificate already exists for level:", currentLevel)
      return res.status(200).json({
        success: true,
        message: "Certifikata tashmë ekziston për këtë nivel",
        certificate: existingCertificate,
      })
    }

    console.log("[v0] Generating certificate PDF for level:", currentLevel)

    const serialNumber = generateSerialNumber(currentLevel, userId)

    // Generate certificate PDF with serial number
    const filePath = await generateCertificatePDF(user, currentLevel, serialNumber)

    console.log("[v0] Certificate PDF generated:", filePath)

    user.certificates.push({
      level: currentLevel,
      filePath: filePath,
      serialNumber: serialNumber,
      issuedAt: new Date(),
    })

    await user.save()

    console.log("[v0] Certificate saved to user")

    res.status(201).json({
      success: true,
      message: "Certifikata u krijua me sukses",
      certificate: user.certificates[user.certificates.length - 1],
    })
  } catch (error) {
    console.error("[v0] Error issuing certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në krijimin e certifikatës", error: error.message })
  }
}

// Get all certificates for a user
exports.getUserCertificates = async (req, res) => {
  try {
    console.log("[v0] Getting certificates for user:", req.user?.id)

    const userId = req.user.id
    const user = await User.findById(userId).select("certificates emri mbiemri level")

    if (!user) {
      console.log("[v0] User not found:", userId)
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    console.log("[v0] Found user certificates:", user.certificates.length)

    res.status(200).json({
      success: true,
      certificates: user.certificates,
    })
  } catch (error) {
    console.error("[v0] Error fetching certificates:", error)
    res.status(500).json({ success: false, message: "Gabim në marrjen e certifikatave", error: error.message })
  }
}

// Download certificate
exports.downloadCertificate = async (req, res) => {
  try {
    const { certificateId } = req.params
    const userId = req.user.id

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const certificate = user.certificates.id(certificateId)
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certifikata nuk u gjet" })
    }

    const filePath = path.join(__dirname, "../public", certificate.filePath)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Skedari i certifikatës nuk u gjet" })
    }

    res.download(filePath, `Certifikata_${certificate.level}.pdf`)
  } catch (error) {
    console.error("Error downloading certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në shkarkimin e certifikatës" })
  }
}

// Manually generate certificate for a specific level (admin only)
exports.generateCertificateForLevel = async (req, res) => {
  try {
    const { userId, level } = req.body

    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(level)) {
      return res.status(400).json({ success: false, message: "Nivel i pavlefshëm" })
    }

    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const existingCertificate = user.certificates.find((cert) => cert.level === level)
    if (existingCertificate) {
      return res.status(400).json({ success: false, message: "Certifikata tashmë ekziston për këtë nivel" })
    }

    const serialNumber = generateSerialNumber(level, userId)
    const filePath = await generateCertificatePDF(user, level, serialNumber)

    user.certificates.push({
      level: level,
      filePath: filePath,
      serialNumber: serialNumber,
      issuedAt: new Date(),
    })

    await user.save()

    res.status(201).json({
      success: true,
      message: "Certifikata u krijua me sukses",
      certificate: user.certificates[user.certificates.length - 1],
    })
  } catch (error) {
    console.error("Error generating certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në krijimin e certifikatës", error: error.message })
  }
}

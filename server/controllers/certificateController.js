const User = require("../models/User")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

const generateSerialNumber = (level) => {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `GLC-${year}${month}-${level}-${randomCode}`
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

      // Elegant gradient-like background with layers
      doc.rect(0, 0, 842, 595).fill("#0f1419")
      doc.rect(20, 20, 802, 555).fill("#ffffff")
      
      // Outer gold border
      doc.strokeColor("#d4af37").lineWidth(3).rect(35, 35, 772, 525).stroke()
      
      // Inner elegant border
      doc.strokeColor("#b8960f").lineWidth(1).rect(45, 45, 752, 505).stroke()

      // Decorative corner elements - more refined
      doc.fillColor("#d4af37")
      
      // Top corners - elegant flourish
      doc.moveTo(55, 55).lineTo(55, 85).lineTo(52, 85).lineTo(52, 52).lineTo(85, 52).lineTo(85, 55).fill()
      doc.moveTo(787, 55).lineTo(787, 85).lineTo(790, 85).lineTo(790, 52).lineTo(757, 52).lineTo(757, 55).fill()
      
      // Bottom corners - elegant flourish
      doc.moveTo(55, 540).lineTo(55, 510).lineTo(52, 510).lineTo(52, 543).lineTo(85, 543).lineTo(85, 540).fill()
      doc.moveTo(787, 540).lineTo(787, 510).lineTo(790, 510).lineTo(790, 543).lineTo(757, 543).lineTo(757, 540).fill()

      // Logo with elegant circular frame
      const logoSize = 85
      const logoX = (842 - logoSize) / 2
      const logoY = 70

      // Gold circle around logo
      doc.strokeColor("#d4af37").lineWidth(2).circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 3).stroke()
      
      doc.save()
      doc.circle(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2).clip()
      doc.image(path.join(__dirname, "../public/images/logo.png"), logoX, logoY, { width: logoSize })
      doc.restore()

      // Decorative line under logo
      doc.strokeColor("#d4af37").lineWidth(1)
      doc.moveTo(321, 175).lineTo(521, 175).stroke()

      // Main title - more elegant spacing
      doc.fontSize(42).fillColor("#0f1419").font("Times-Bold").text("CERTIFIKATË E PËRFUNDIMIT", 0, 195, {
        align: "center",
        width: 842,
        characterSpacing: 1
      })

      // Decorative line under title
      doc.strokeColor("#d4af37").lineWidth(1)
      doc.moveTo(321, 245).lineTo(521, 245).stroke()

      // Intro text - refined
      doc.fontSize(14).fillColor("#4a5568").font("Times-Italic").text("Me kënaqësi vërtetojmë se", 0, 265, {
        align: "center",
        width: 842,
      })

      // User name - more prominent and elegant
      doc.fontSize(52).fillColor("#d4af37").font("Times-Bold").text(`${user.emri} ${user.mbiemri}`, 0, 295, {
        align: "center",
        width: 842,
        characterSpacing: 0.5
      })

      // Decorative accent under name
      doc.fillColor("#d4af37")
      doc.moveTo(371, 355).lineTo(421, 358).lineTo(471, 355).fill()

      // Completion text
      doc.fontSize(16).fillColor("#4a5568").font("Times-Roman").text("ka përfunduar me sukses programin e gjuhës gjermane", 0, 375, {
        align: "center",
        width: 842,
      })

      // Level badge - elegant design
      doc.fontSize(72).fillColor("#0f1419").font("Times-Bold").text(level, 0, 410, {
        align: "center",
        width: 842,
        characterSpacing: 2
      })

      // Decorative elements around level
      doc.strokeColor("#d4af37").lineWidth(2)
      doc.moveTo(300, 455).lineTo(370, 455).stroke()
      doc.moveTo(472, 455).lineTo(542, 455).stroke()

      // Issue date section - refined
      const issueDate = new Date().toLocaleDateString("sq-AL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      
      doc.fontSize(15).fillColor("#2d3748").font("Times-Roman").text(issueDate, 0, 488, {
        align: "center",
        width: 842,
      })

      // Serial number - top right, elegant
      doc.fontSize(9).fillColor("#718096").font("Times-Italic").text(`Nr. Serie: ${serialNumber}`, 0, 60, {
        align: "right",
        width: 772,
      })

      // Bottom signature line - refined
      doc.strokeColor("#2d3748").lineWidth(1)
      doc.moveTo(321, 530).lineTo(521, 530).stroke()
      
      doc.fontSize(11).fillColor("#4a5568").font("Times-Italic").text("Drejtori i Programit", 0, 538, {
        align: "center",
        width: 842,
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
    console.log("[v0] ===== CERTIFICATE ISSUE REQUEST =====")
    console.log("[v0] Request user:", req.user?.id)

    const userId = req.user.id
    const user = await User.findById(userId)

    if (!user) {
      console.log("[v0] User not found:", userId)
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

    const currentLevel = user.level
    console.log("[v0] User found:", user.emri, user.mbiemri)
    console.log("[v0] User current level:", currentLevel)

    if (!currentLevel) {
      console.log("[v0] No certificate issued - level is null")
      return res.status(200).json({
        success: false,
        message: "Certifikata nuk lëshohet nëse niveli nuk është vendosur",
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

    console.log("[v0] Generating new certificate for level:", currentLevel)

    const serialNumber = generateSerialNumber(currentLevel)
    const filePath = await generateCertificatePDF(user, currentLevel, serialNumber)

    user.certificates.push({
      level: currentLevel,
      filePath: filePath,
      serialNumber: serialNumber,
      issuedAt: new Date(),
    })

    await user.save()

    console.log("[v0] Certificate created successfully")

    const newCertificate = user.certificates[user.certificates.length - 1]

    res.status(201).json({
      success: true,
      message: "Certifikata u krijua me sukses",
      certificate: newCertificate,
    })
  } catch (error) {
    console.error("[v0] Error issuing certificate:", error)
    res.status(500).json({ success: false, message: "Gabim në krijimin e certifikatës", error: error.message })
  }
}

// Get all certificates for a user
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id
    const user = await User.findById(userId).select("certificates emri mbiemri level")

    if (!user) {
      return res.status(404).json({ success: false, message: "Përdoruesi nuk u gjet" })
    }

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

    res.download(filePath, `Certifikata_${certificate.level}_${user.emri}_${user.mbiemri}.pdf`)
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

    const serialNumber = generateSerialNumber(level)
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
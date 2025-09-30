const User = require("../models/User")
const PDFDocument = require("pdfkit")
const fs = require("fs")
const path = require("path")

// Helper function to generate certificate PDF
const generateCertificatePDF = async (user, level) => {
  return new Promise((resolve, reject) => {
    try {
      // Create certificates directory if it doesn't exist
      const certificatesDir = path.join(__dirname, "../public/certificates")
      if (!fs.existsSync(certificatesDir)) {
        fs.mkdirSync(certificatesDir, { recursive: true })
      }

      const fileName = `certificate_${user._id}_${level}_${Date.now()}.pdf`
      const filePath = path.join(certificatesDir, fileName)
      const doc = new PDFDocument({ size: "A4", layout: "landscape" })
      const stream = fs.createWriteStream(filePath)

      doc.pipe(stream)

      // Certificate Design
      // Background gradient effect with rectangles
      doc.rect(0, 0, 842, 595).fill("#f8f9fa")

      // Decorative border
      doc.strokeColor("#14b8a6").lineWidth(8).rect(30, 30, 782, 535).stroke()
      doc.strokeColor("#0d9488").lineWidth(4).rect(40, 40, 762, 515).stroke()

      // Top decorative elements
      doc.fillColor("#14b8a6").circle(100, 100, 30).fill()
      doc.fillColor("#0d9488").circle(742, 100, 30).fill()
      doc.fillColor("#14b8a6").circle(100, 495, 30).fill()
      doc.fillColor("#0d9488").circle(742, 495, 30).fill()

      // Title
      doc.fontSize(48).fillColor("#1f2937").font("Helvetica-Bold").text("CERTIFIKATË", 0, 100, {
        align: "center",
        width: 842,
      })

      doc.fontSize(20).fillColor("#6b7280").font("Helvetica").text("Kjo certifikatë jepet për", 0, 160, {
        align: "center",
        width: 842,
      })

      // User name
      doc.fontSize(36).fillColor("#14b8a6").font("Helvetica-Bold").text(`${user.emri} ${user.mbiemri}`, 0, 210, {
        align: "center",
        width: 842,
      })

      // Achievement text
      doc.fontSize(18).fillColor("#4b5563").font("Helvetica").text("për përfundimin me sukses të nivelit", 0, 270, {
        align: "center",
        width: 842,
      })

      // Level badge
      doc.fontSize(60).fillColor("#0d9488").font("Helvetica-Bold").text(level, 0, 310, {
        align: "center",
        width: 842,
      })

      doc.fontSize(16).fillColor("#6b7280").font("Helvetica").text("në gjuhën Gjermane", 0, 390, {
        align: "center",
        width: 842,
      })

      // Date
      const issueDate = new Date().toLocaleDateString("sq-AL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      doc.fontSize(14).fillColor("#9ca3af").font("Helvetica-Oblique").text(`Lëshuar më: ${issueDate}`, 0, 450, {
        align: "center",
        width: 842,
      })

      // Signature line
      doc.moveTo(321, 510).lineTo(521, 510).strokeColor("#d1d5db").lineWidth(1).stroke()
      doc.fontSize(12).fillColor("#6b7280").font("Helvetica").text("Nënshkrimi i Drejtorit", 0, 520, {
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

    // Generate certificate PDF
    const filePath = await generateCertificatePDF(user, currentLevel)

    console.log("[v0] Certificate PDF generated:", filePath)

    // Add certificate to user
    user.certificates.push({
      level: currentLevel,
      filePath: filePath,
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

    const filePath = await generateCertificatePDF(user, level)

    user.certificates.push({
      level: level,
      filePath: filePath,
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

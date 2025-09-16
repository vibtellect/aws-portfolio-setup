# 🆓 AWS ALB Free Tier - GAME CHANGER Analyse!

## 📊 **ALB Free Tier Details (aus AWS-Dokumentation):**

### **Kostenloses AWS-Kontingent für ELB:**
```bash
Bei der Anmeldung erhalten neue AWS-Kunden:
✅ 750 Stunden pro Monat (zwischen Classic und ALB aufgeteilt)
✅ 15 GB Datenverarbeitung für Classic Load Balancer
✅ 15 LCUs für Application Load Balancer
```

### **Was bedeuten 15 LCUs pro Monat?**

**Eine LCU enthält:**
- 25 neue Verbindungen pro Sekunde
- 3.000 aktive Verbindungen pro Minute  
- 1 GB pro Stunde für EC2-Targets
- 1.000 Regelauswertungen pro Sekunde

**15 LCUs = 15 Stunden LCU-Usage kostenlos!**

---

## 💰 **KOMPLETT NEUE Kostenberechnung mit Free Tier:**

### **ALB-Architektur mit Free Tier (Jahr 1):**

```bash
# 🆓 NEUE ALB-Kosten (Jahr 1) mit Free Tier:
ALB Fixed Hours (750h)    : 0.00€   # ✅ 750h kostenlos!
ALB Remaining Hours (0h)  : 0.00€   # Nur 24*30=720h benötigt!
ALB LCU Usage (15 LCU)    : 0.00€   # ✅ 15 LCU kostenlos!
ALB Additional LCU        : ~2.00€   # Minimaler Zusatz für Dev-Traffic

EC2 t3.small (3x)         : 27.00€   # 3 × 9€/month
RDS t3.micro               : 0.00€   # ✅ Free Tier
S3 + CloudFront           : 0.25€   # ✅ Free Tier
CloudWatch                : 0.50€   
───────────────────────────────────────
TOTAL (ALB + Free Tier)   : ~29.75€/Monat (Jahr 1)
TOTAL (nach Free Tier)    : ~47.75€/Monat (Jahr 2+)
```

### **Vergleich ALLE Architekturen (Jahr 1):**

| Architektur | Jahr 1 | Jahr 2+ | Pro/Con |
|-------------|--------|---------|----------|
| **Single EC2 + Nginx** | 13.75€ | 25.75€ | ✅ Günstigste, weniger Skalierbarkeit |
| **ALB (mit Free Tier)** | 29.75€ | 47.75€ | ⚠️ Teurer, aber echte Load Balancing |
| **ALB (ohne Free Tier)** | 46.08€ | 46.08€ | ❌ Zu teuer |

---

## 🤔 **ALB Free Tier - Ist es das wert?**

### **✅ ALB Vorteile:**
1. **Echter Load Balancer** (nicht nur Reverse Proxy)
2. **Health Checks** mit automatischem Failover
3. **Auto Scaling** Integration möglich
4. **Path-based Routing** (/api/v1/* → Python, /files/* → Go)
5. **SSL Termination** direkt am ALB
6. **Multi-AZ Deployment** möglich
7. **AWS-native Integration** (CloudWatch, Route53)
8. **Production-Ready** aus der Box

### **❌ ALB Nachteile:**
1. **16€ teurer** als Single-Instance (Jahr 1)
2. **22€ teurer** nach Free Tier Ablauf
3. **Komplexere Setup** (Terraform)
4. **Überdimensioniert** für Lernprojekt

---

## 🎯 **Neue Empfehlung basierend auf Free Tier:**

### **Scenario A: Lernfokus (Empfohlen)**
```bash
Architektur: Single EC2 + Nginx
Kosten:      13.75€/Monat
Vorteil:     Günstig, einfach, direkter Container-Access
Nachteil:    Kein echter Load Balancer
Zielgruppe:  Lernende, Budget-bewusst
```

### **Scenario B: Production-ähnlich**
```bash
Architektur: ALB + 3x EC2
Kosten:      29.75€/Monat (Jahr 1), 47.75€ (Jahr 2+) 
Vorteil:     Echter Load Balancer, skalierbar, AWS-native
Nachteil:    2x teurer, komplexer
Zielgruppe:  Portfolio für Job-Bewerbungen
```

---

## 📊 **Budget-Empfehlungen aktualisiert:**

### **Für kostenbewusstes Lernen:**
- **Architektur**: Single EC2 + Nginx  
- **Budget**: 15€/Monat
- **Zeitrahmen**: Unbegrenzt lernbar

### **Für Portfolio/Bewerbung:**
- **Architektur**: ALB + Multi-Instance
- **Budget**: 35€/Monat (Jahr 1), 50€ (Jahr 2+)
- **Zeitrahmen**: 3-6 Monate zeigen, dann Single-Instance

---

## 🚀 **Finale Empfehlung:**

### **Start mit Single-Instance, Option auf ALB-Upgrade:**

```bash
# Phase 1 (Monat 1-2): Lernen & Development
Architektur: Single EC2 + Nginx
Budget:      15€/Monat
Fokus:       Docker, Microservices, Terraform lernen

# Phase 2 (Monat 3-4): Portfolio-Optimierung  
Architektur: ALB + Multi-Instance (optional)
Budget:      35€/Monat (Free Tier nutzen!)
Fokus:       Production-ähnliche Architektur für CV

# Phase 3 (Monat 5+): Kostenoptimierung
Architektur: Zurück zu Single-Instance
Budget:      15€/Monat
Fokus:       Langzeit-Learning-Environment
```

**Das Free Tier gibt uns mehr Flexibilität - wir können beide Architekturen ausprobieren!**

---

*Analysiert am 16.09.2025 - ALB Free Tier Details validiert*
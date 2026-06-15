$ErrorActionPreference = 'Stop'
$dir = 'C:\Software_Install_LRH\WorkEasy\assets'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 256, 256
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$rect = [System.Drawing.Rectangle]::new(0, 0, 256, 256)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(79, 70, 229)), ([System.Drawing.Color]::FromArgb(6, 182, 212)), 45
$g.FillEllipse($brush, 16, 16, 224, 224)
$fontBig = New-Object System.Drawing.Font 'Segoe UI', 64, ([System.Drawing.FontStyle]::Bold)
$fontSmall = New-Object System.Drawing.Font 'Segoe UI', 31, ([System.Drawing.FontStyle]::Bold)
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$center = New-Object System.Drawing.StringFormat
$center.Alignment = [System.Drawing.StringAlignment]::Center
$center.LineAlignment = [System.Drawing.StringAlignment]::Center
$g.DrawString('AI', $fontBig, $white, ([System.Drawing.RectangleF]::new(0, 42, 256, 86)), $center)
$g.DrawString('ToMe', $fontSmall, $white, ([System.Drawing.RectangleF]::new(0, 122, 256, 64)), $center)
$g.FillEllipse($white, 116, 196, 24, 24)
$png = Join-Path $dir 'AiToMe.png'
$bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
$icon = Join-Path $dir 'AiToMe.ico'
$fs = [System.IO.File]::Create($icon)
$bw = New-Object System.IO.BinaryWriter($fs)
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$bytes = $ms.ToArray()
$bw.Write([UInt16]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]1)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([Byte]0)
$bw.Write([UInt16]1)
$bw.Write([UInt16]32)
$bw.Write([UInt32]$bytes.Length)
$bw.Write([UInt32]22)
$bw.Write($bytes)
$bw.Close()
$fs.Close()
$g.Dispose()
$bmp.Dispose()
Write-Output $icon

# Maintainer: Sanchit Core <me@sanchit-core.com>
pkgname=tulip-tasks
pkgver=0.1.5
pkgrel=1
pkgdesc="Neo-brutalist task board with calendar, backlog inbox and recurring tasks"
arch=('x86_64')
url="https://github.com/sanchit-core/tulip-tasks"
license=('MIT')
depends=()
makedepends=()
options=(!strip)
source=("tulip-tasks-0.1.5-x86_64.AppImage::https://github.com/sanchit-core/tulip-tasks/releases/download/v0.1.5/tulip-tasks_0.1.5_linux_x86_64.AppImage")
sha256sums=('SKIP')

package() {
  install -Dm755 "$srcdir/tulip-tasks-0.1.5-x86_64.AppImage" "$pkgdir/usr/bin/tulip-tasks"
  install -Dm644 "$srcdir/tulip-tasks-0.1.5-x86_64.AppImage" "$pkgdir/opt/tulip-tasks/tulip-tasks.AppImage"
  
  # Create desktop entry
  install -Dm644 /dev/null "$pkgdir/usr/share/applications/tulip-tasks.desktop" 2>/dev/null || true
  
  # Install icon
  install -Dm644 /dev/null "$pkgdir/usr/share/icons/hicolor/256x256/apps/tulip-tasks.png" 2>/dev/null || true
  
  # Documentation
  install -Dm644 "$srcdir/$pkgname-$pkgver/LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE" 2>/dev/null || true
}
type Cleanup = () => void

function addListener(
  target: Element | null,
  eventName: string,
  listener: EventListener,
  cleanups: Cleanup[],
) {
  if (!target) {
    return
  }

  target.addEventListener(eventName, listener)
  cleanups.push(() => target.removeEventListener(eventName, listener))
}

export function bindStaticDrawer(root: HTMLElement) {
  const cleanups: Cleanup[] = []

  const menuButton =
    root.querySelector<HTMLElement>('#menu-btn') ??
    root.querySelector<HTMLElement>('button[aria-label="Menu"]') ??
    root.querySelector<HTMLElement>('header [onclick="toggleDrawer()"]')

  const closeButton =
    root.querySelector<HTMLElement>('#close-drawer-btn') ??
    root.querySelector<HTMLElement>('#drawer-close') ??
    root.querySelector<HTMLElement>('#close-drawer') ??
    root.querySelector<HTMLElement>('aside button[onclick="toggleDrawer()"]')

  const drawer =
    root.querySelector<HTMLElement>('#nav-drawer') ??
    root.querySelector<HTMLElement>('#navDrawer') ??
    root.querySelector<HTMLElement>('#drawer-panel')

  const overlay =
    root.querySelector<HTMLElement>('#drawer-backdrop') ??
    root.querySelector<HTMLElement>('#drawerBackdrop') ??
    root.querySelector<HTMLElement>('#drawer-overlay')

  const drawerContainer = root.querySelector<HTMLElement>('#drawer-container')

  if (!menuButton || !drawer) {
    return () => undefined
  }

  let closeTimeout = 0

  const clearCloseTimeout = () => {
    if (closeTimeout) {
      window.clearTimeout(closeTimeout)
      closeTimeout = 0
    }
  }

  const openDrawer = () => {
    clearCloseTimeout()

    if (drawerContainer) {
      drawerContainer.classList.remove('pointer-events-none')
    }

    if (overlay) {
      overlay.classList.remove('hidden', 'opacity-0', 'pointer-events-none')
      overlay.classList.add('opacity-100', 'pointer-events-auto')
    }

    drawer.classList.remove('-translate-x-full')
    document.body.style.overflow = 'hidden'
  }

  const closeDrawer = () => {
    clearCloseTimeout()

    drawer.classList.add('-translate-x-full')

    if (overlay) {
      overlay.classList.remove('opacity-100', 'pointer-events-auto')
      overlay.classList.add('opacity-0')

      closeTimeout = window.setTimeout(() => {
        overlay.classList.add('hidden')
        overlay.classList.add('pointer-events-none')
      }, 300)
    }

    if (drawerContainer) {
      closeTimeout = window.setTimeout(() => {
        drawerContainer.classList.add('pointer-events-none')
      }, 300)
    }

    document.body.style.overflow = ''
  }

  const toggleDrawer = () => {
    if (drawer.classList.contains('-translate-x-full')) {
      openDrawer()
      return
    }

    closeDrawer()
  }

  addListener(menuButton, 'click', event => {
    event.preventDefault()
    toggleDrawer()
  }, cleanups)

  addListener(closeButton, 'click', event => {
    event.preventDefault()
    closeDrawer()
  }, cleanups)

  addListener(overlay, 'click', event => {
    event.preventDefault()
    closeDrawer()
  }, cleanups)

  root.querySelectorAll('nav a').forEach(link => {
    addListener(link, 'click', () => {
      closeDrawer()
    }, cleanups)
  })

  return () => {
    clearCloseTimeout()
    document.body.style.overflow = ''
    cleanups.forEach(cleanup => cleanup())
  }
}

export const STORAGE_URL = import.meta.env.VITE_STORAGE_URL as string

const b = (bucket: string, file: string) => `${STORAGE_URL}/${bucket}/${file}`

// Logo principal
const logo = b('motogest-logo', 'RphFp.svg')

// Carrusel hero — 9 imágenes
const carousel = [
  b('motogest-carousel', 'pexels-jarod-13548637.webp'),
  b('motogest-carousel', 'pexels-rodolfoclix-1161996.webp'),
  b('motogest-carousel', 'pexels-chimango-hara-215507114-3-36818349.webp'),
  b('motogest-carousel', 'pexels-rccbtn-8063429.webp'),
  b('motogest-carousel', 'V2FaR.webp'),
  b('motogest-carousel', 'pexels-jannisr-30866489.webp'),
  b('motogest-carousel', 'pexels-luisbecerrafotografo-12993740.webp'),
  b('motogest-carousel', 'lubirrr.webp'),
  b('motogest-carousel', 'LLANTA-WEB.webp'),
]

// Categorías — 22 imágenes
const categorias = {
  stingularPurpura:   b('motogest-categorias', 'FF806-STINGULAR-NMPURPURA.webp'),
  stingularRojo:      b('motogest-categorias', 'FF806-STINGULAR-NMROJO.webp'),
  cascoTnt:           b('motogest-categorias', 'CASCO%20TNT.webp'),
  guantes:            b('motogest-categorias', 'GUANTES.webp'),
  tablerosBanner:     b('motogest-categorias', 'TABLEROS%20BANNER.webp'),
  guanteMcs29:        b('motogest-categorias', 'GUANTE%20MCS-29%20PRO-BIKER.webp'),
  banner3:            b('motogest-categorias', 'banner-3.webp'),
  repuestos1:         b('motogest-categorias', 'REPUESTOS%20(1).webp'),
  accesorios1:        b('motogest-categorias', 'accesorios1.webp'),
  acce:               b('motogest-categorias', 'ACCE.webp'),
  accesDeMoto:        b('motogest-categorias', 'ACCES-DE-MOTO.webp'),
  carb2:              b('motogest-categorias', 'CARB2.webp'),
  cilindroCilindro:   b('motogest-categorias', 'CICLINDRO-C.webp'),
  kitArrastre:        b('motogest-categorias', 'KIT%20ARRASTRE%20C.webp'),
  lubri:              b('motogest-categorias', 'LUBRI.webp'),
  repuestos:          b('motogest-categorias', 'REPUESTOS.webp'),
  amortC:             b('motogest-categorias', 'amort%20C.webp'),
  tableroDigital:     b('motogest-categorias', 'tablero-digital-xo-universal-gdm.webp'),
  iconos04:           b('motogest-categorias', 'Iconos-04.webp'),
  iconos03:           b('motogest-categorias', 'Iconos-03.webp'),
  iconos01:           b('motogest-categorias', 'Iconos-01.webp'),
  iconos02:           b('motogest-categorias', 'Iconos-02.webp'),
}

// Avatares
const avatares = {
  perfil: b('motogest-avatares', 'perfil.svg'),
}

// Marcas — array ordenado para carrusel, con nombre y URL
const marcas = [
  { nombre: 'CST',         url: b('motogest-marcas', 'Mesa%20de%20trabajo%206.webp') },
  { nombre: 'Wanda Tyre',  url: b('motogest-marcas', 'Mesa%20de%20trabajo%207.webp') },
  { nombre: 'Heng Shin',   url: b('motogest-marcas', 'Mesa%20de%20trabajo%208.webp') },
  { nombre: 'No Stone',    url: b('motogest-marcas', 'Mesa%20de%20trabajo%209.webp') },
  { nombre: 'Baisiji',     url: b('motogest-marcas', 'Mesa%20de%20trabajo%2010.webp') },
  { nombre: 'King Stone',  url: b('motogest-marcas', 'Mesa%20de%20trabajo%2011.webp') },
  { nombre: 'Scoyco',      url: b('motogest-marcas', 'Mesa%20de%20trabajo%2012.webp') },
  { nombre: 'Repsol',      url: b('motogest-marcas', 'Mesa%20de%20trabajo%2013.webp') },
  { nombre: 'Pro Biker',   url: b('motogest-marcas', 'Mesa%20de%20trabajo%2014.webp') },
  { nombre: 'Motul',       url: b('motogest-marcas', 'Mesa%20de%20trabajo%2015.webp') },
  { nombre: 'Michelin',    url: b('motogest-marcas', 'Mesa%20de%20trabajo%2016.webp') },
  { nombre: 'Heng Shin 2', url: b('motogest-marcas', 'Mesa%20de%20trabajo%2017.webp') },
  { nombre: 'Suzuki',      url: b('motogest-marcas', 'Mesa%20de%20trabajo%2018.webp') },
]

export const assets = {
  logo,
  carousel,
  categorias,
  avatares,
  marcas,
}

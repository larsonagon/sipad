import { renderHeader } from '../components/header.js'

function getToken(){
  return sessionStorage.getItem('token')
}

function getUserFromToken(){

  const token = getToken()

  if(!token) return null

  try{
    return JSON.parse(atob(token.split('.')[1]))
  }catch{
    return null
  }

}

document.addEventListener('DOMContentLoaded',()=>{

  const token = getToken()

  if(!token){
    window.location.href='/'
    return
  }

  const user = getUserFromToken()

  if(!user){
    window.location.href='/'
    return
  }

  renderHeader('Informes',user)

  configurarCards()

})



function configurarCards(){

  const cardRegistro =
  document.getElementById('cardRegistro')

  const cardDependencia =
  document.getElementById('cardDependencia')

  const cardProduccion =
  document.getElementById('cardProduccion')


  cardRegistro.addEventListener('click',()=>{
    window.location.href='/informes/registro.html'
  })

  cardDependencia.addEventListener('click',()=>{
    window.location.href='/informes/dependencia.html'
  })

  cardProduccion.addEventListener('click',()=>{
    window.location.href='/informes/produccion.html'
  })


  document
  .querySelectorAll('.module-card')
  .forEach(card=>{

    card.addEventListener('keypress',e=>{
      if(e.key==='Enter'){
        card.click()
      }
    })

  })

}
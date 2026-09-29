const navBtns = document.querySelectorAll('.nav-btn')
navBtns[0].classList.add('navegacao-selected')
let btnPaginaAberta = navBtns[0]

navBtns.forEach(nav => {
    nav.addEventListener('click', ()=>{
        btnPaginaAberta.classList.remove('navegacao-selected')
        let id = btnPaginaAberta.querySelector('label').htmlFor
        document.getElementById(id).classList.add('esconder')
        nav.classList.add('navegacao-selected')
        btnPaginaAberta = nav
        id = btnPaginaAberta.querySelector('label').htmlFor
        document.getElementById(id).classList.remove('esconder')
    })
})
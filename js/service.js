'use strict'

function onInit(){
    renderPortfolio();
}

function renderPortfolio(){
    var projs = getProjs();
    var strHtml = ''

    for (var i= 0; i<projs.length;i++){
        strHtml += `<div class="col-md-4 col-sm-6 portfolio-item">
        <a class="portfolio-link" data-toggle="modal" href="#portfolioModal${i+1}">
          <div class="portfolio-hover">
            <div class="portfolio-hover-content">
              <i class="fa fa-plus fa-3x"></i>
            </div>
          </div>
          <img class="img-fluid" src="img/portfolio/0${i+1}-thumbnail.jpg" alt="">
        </a>
        <div class="portfolio-caption">
          <h4>${projs[i].name}</h4>
          <p class="text-muted">${projs[i].labels}</p>
        </div>
      </div>`
    }
    var $elPortfolios = $('.portfolios')
    $elPortfolios.html(strHtml)

}

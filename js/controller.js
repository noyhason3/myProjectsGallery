'use strict';

function onInit() {
  $('.submitMsg').on('click', onSubmitMsg);

  renderPortfolio();
}

function renderPortfolio() {
  var projs = getProjs();
  var strHtml = projs.map(function (proj) {
    return `
    <div class="proj col-md-4 col-sm-6 portfolio-item" data-id="${proj.id}">
        <a class="portfolio-link" data-toggle="modal" onclick="onShowProj('${proj.id}')" href="#portfolioModal">
          <div class="portfolio-hover">
            <div class="portfolio-hover-content">
              <i class="fa fa-plus fa-3x"></i>
            </div>
          </div>
          <img class="img-fluid" src="img/portfolio/${proj.id}-thumbnail.jpg" alt="">
        </a>
        <div class="portfolio-caption">
          <h4>${proj.name}</h4>
          <p class="text-muted">${proj.title}</p>
        </div>
    </div>`;
  });

  var $elPortfolios = $('.portfolios');
  $elPortfolios.html(strHtml);
}

function onShowProj(projId) {
  var projs = getProjs();
  var proj = projs.find(function (proj) {
    return proj.id === projId;
  });

  var date = new Date(proj.publishedAt).toLocaleDateString();

  var strHtml = `
  <h2>${proj.name}</h2>
    <p class="item-intro text-muted">${proj.title}</p>
    <img class="img-fluid d-block mx-auto" src="img/portfolio/${proj.id}-thumbnail.jpg" alt="">
    <p>${proj.desc}</p>
    <ul class="list-inline">
      <li>Date: ${date}</li>
      <li>Category: ${proj.labels}</li>
    </ul>
    
    <div>
    <a href="${proj.url}" class="btn btn-primary stretched-link">Check it Out</a>
    </div>
    
    <button class="btn" data-dismiss="modal" type="button">
    <i class="fa fa-times"></i>
    Close Project
    </button>`;

  var $elModal = $('.modal-body');
  $elModal.html(strHtml);
}

function onSubmitMsg() {
  var email = $('#emailAdress').val();
  var subject = $('#subject').val();
  var msgBody = $('#messageBody').val();

  var url = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}&body=${msgBody}`;

  window.open(url);
}

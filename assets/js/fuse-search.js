var searchWrapper = document.querySelector(".search-wrapper");
var searchModal = document.querySelector(".search-modal");
var searchFooter = document.querySelector(".search-wrapper-footer");
var searchResult = document.querySelectorAll("[data-search-result]");
var searchResultItemTemplate = document.getElementById("search-result-item-template");
var hasSearchWrapper = searchWrapper != null;
var hasSearchModal = searchModal != null;
var searchInput = document.querySelectorAll("[data-search-input]");
var emptySearchResult = document.querySelectorAll(".search-result-empty");
var openSearchModal = document.querySelectorAll('[data-target="search-modal"]');
var closeSearchModal = document.querySelectorAll('[data-target="close-search-modal"]');
var searchIcon = document.querySelector(".search-wrapper-header label svg[data-type='search']");
var searchIconReset = document.querySelector(".search-wrapper-header label svg[data-type='reset']");
var searchResultInfo = document.querySelector(".search-result-info");
let searchModalVisible =
  hasSearchModal && searchModal.classList.contains("show") ? true : false;
let jsonData = [];
var image ;
var description ;
var tags ;
var categories ;

var pageSize = 10;    // 结果分页默认大小
var pageStart = 1;    // 起始页面
var hitSearchTotal = 0;

var fuse; // holds our search engine
var fuseIndex;

const options = { // fuse.js options; check fuse.js website for details
  distance: 100,
  includeMatches: true,
  location: 0,
  matchAllTokens: true,
  maxPatternLength: 64,
  minMatchCharLength: 2,
  shouldSort: true,
  threshold: 0.4,
  tokenize: true,
  keys: [
    {name:"title",weight:0.8},
    {name:"tags",weight:0.5},
    {name:"categories",weight:0.5},
    {name:"content",weight:0.4}
  ]
};

const loadJsonData = async () => {
  try {
    const res = await fetch(indexURL);

    res.json()
      .then((jsonData) => {
        fuseIndex = Fuse.createIndex(options.keys, jsonData)
        fuse = new Fuse(jsonData, options, fuseIndex); // build the index from the json file
    });
  } catch (err) {
    console.error(err);
  }
};

  // dom content loaded
document.addEventListener("DOMContentLoaded", async () => {
  await loadJsonData();
  init();
  //doSearch(searchString);
});

// escape HTML entities
function escapeHTML(input) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
// Capitalize First Letter
const capitalizeFirstLetter = (string) => {
  return string
    .replace(/^[\s_]+|[\s_]+$/g, "")
    .replace(/[_\s]+/g, " ")
    .replace(/^[a-z]/, function (m) {
      return m.toUpperCase();
    });
};

// String to URL
const slugify = (string) => {
  let lowercaseText = string
    .trim()
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
  return encodeURIComponent(lowercaseText);
};

// Close modal with ESC
const closeSearchModalWithESC = (e) => {
  if (e.key === "Escape") {
    if (searchModalVisible) {
      e.preventDefault();
      closeModal();
    }
  }
};

// Toggle modal on Ctrl + K / Cmd + K
const toggleSearchModalWithK = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    if (searchModalVisible) {
      e.preventDefault();
      closeModal();
    } else {
      e.preventDefault();
      showModal();
    }
  }
};

const highlighter = function(hitItem){
  hitItem.item.highlight = {};
  hitItem.matches.forEach((matchItem) => {
    var text = hitItem.item[matchItem.key];
    var result = []
    var matches = [].concat(matchItem.indices); // limpar referencia
    var pair = matches.shift()
    
    for (var i = 0; i < text.length; i++) {
      var char = text.charAt(i)
      if (pair && i == pair[0]) {
        if (matchItem.key == "content") {
          result.push('<mark>')
        } else {
          result.push('<u>')
        }
      }
      result.push(char)
      if (pair && i == pair[1]) {
        if (matchItem.key == "content") {
          result.push('</mark>')
        } else {
          result.push('</u>')
        }
        pair = matches.shift()
      }
    }
    hitItem.item.highlight[matchItem.key] = result.join('');
    
    //resultItem.item[matchItem.key] = result.join('');

    if(hitItem.children && hitItem.children.length > 0){
      hitItem.children.forEach((child) => {
        highlighter(child);
      });
    }
  });
};

// doSearch
const doSearch = async (searchString) => {
  pageStart = 0;
  if (searchString !== "") {
    searchIcon && (searchIcon.style.display = "none");
    searchIconReset && (searchIconReset.style.display = "initial");
    emptySearchResult.forEach((el) => {
      const notFoundContent = `
<div class="search-not-found">
  <svg width="42" height="42" viewBox="0 0 47 47" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M7.10368 33.9625C9.90104 36.2184 13.2988 37.6547 16.9158 38.0692C21.6958 38.617 26.5063 37.3401 30.3853 34.4939C30.4731 34.6109 30.5668 34.7221 30.6721 34.8304L41.9815 46.1397C42.5323 46.6909 43.2795 47.0007 44.0587 47.001C44.838 47.0013 45.5854 46.692 46.1366 46.1412C46.6878 45.5904 46.9976 44.8432 46.9979 44.064C46.9981 43.2847 46.6888 42.5373 46.138 41.9861L34.8287 30.6767C34.7236 30.5704 34.6107 30.4752 34.4909 30.3859C37.3352 26.5046 38.6092 21.6924 38.0579 16.912C37.6355 13.2498 36.1657 9.81322 33.8586 6.9977L31.7805 9.09214C34.0157 11.9274 35.2487 15.4472 35.2487 19.0942C35.2487 21.2158 34.8308 23.3167 34.0189 25.2769C33.207 27.2371 32.0169 29.0181 30.5167 30.5184C29.0164 32.0186 27.2354 33.2087 25.2752 34.0206C23.315 34.8325 21.2141 35.2504 19.0925 35.2504C16.9708 35.2504 14.8699 34.8325 12.9098 34.0206C11.5762 33.4682 10.3256 32.7409 9.18992 31.8599L7.10368 33.9625ZM28.9344 6.28152C26.1272 4.12516 22.671 2.93792 19.0925 2.93792C14.8076 2.93792 10.6982 4.64009 7.66829 7.66997C4.6384 10.6999 2.93623 14.8093 2.93623 19.0942C2.93623 21.2158 3.35413 23.3167 4.16605 25.2769C4.72475 26.6257 5.4625 27.8897 6.35716 29.0358L4.2702 31.1391C1.35261 27.548 -0.165546 23.0135 0.00974294 18.3781C0.19158 13.5695 2.18233 9.00695 5.58371 5.60313C8.98509 2.19932 13.5463 0.205307 18.3547 0.0200301C22.9447 -0.156832 27.4369 1.32691 31.0132 4.18636L28.9344 6.28152Z" fill="currentColor"/>
    <path d="M3.13672 39.1367L38.3537 3.64355" stroke="black" stroke-width="3" stroke-linecap="round"/>
  </svg>
  <p>${search_no_results} "<b>${escapeHTML(searchString)}</b>"</p>
</div>
`;
      el.innerHTML = notFoundContent;
    });
  } else {
    searchIcon && (searchIcon.style.display = "initial");
    searchIconReset && (searchIconReset.style.display = "none");
    emptySearchResult.forEach((el) => {
      el.innerHTML = search_initial_message;
    });
  }

  // search query str
  const startTime = performance.now();
  let hitResults = fuse.search(searchString);
  const usedTime = performance.now() - startTime;
  hitSearchTotal = hitResults.length;
  pageStart = 1;

  // highlighter hit result items
  hitResults.forEach((hitItem) => {
    highlighter(hitItem);
  });

  // pagenation
  let curHitItems  = hitResults.map((hitItem) => {
    return hitItem.item;
  });
  //.slice((pageStart - 1) * pageSize, pageStart * pageSize);

  //console.log(curHitItems);

  // render items
  displayResult(curHitItems, searchString, usedTime);

  // Navigate with arrow keys
  if (searchModal && searchString != "") {
    let resItems;
    resItems = searchResult[0].querySelectorAll(".search-result-item");
    let selectedIndex = -1;

    const selectItem = (index) => {
      if (index >= 0 && index < resItems.length) {
        for (let i = 0; i < resItems.length; i++) {
          resItems[i].classList.toggle("search-item-selected", i === index);
        }
        selectedIndex = index;
        resItems[index].scrollIntoView({
          behavior: "auto",
          block: "nearest",
        });
      }
    };

    const handleKeyDown = (event) => {
      if (curHitItems.length !== 0) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") {
          event.preventDefault();

          if (event.key === "ArrowUp") {
            selectedIndex =
              selectedIndex > 0 ? selectedIndex - 1 : resItems.length - 1;
          } else if (event.key === "ArrowDown") {
            selectedIndex =
              selectedIndex < resItems.length - 1 ? selectedIndex + 1 : 0;
          }

          selectItem(selectedIndex !== -1 ? selectedIndex : -1);
        } else if (event.key === "PageDown") {
          event.preventDefault();
          pageStart = pageStart + pageSize > hitSearchTotal? pageStart: pageStart + pageSize;
          //console.log("pageStart: " + pageStart);
        } else if (event.key === "PageUp") {
          event.preventDefault();
          pageStart = pageStart > pageSize ? pageStart - pageSize : pageStart;
          //console.log("pageStart: " + pageStart);
        } else if (event.key === "Enter") {
          event.preventDefault();

          if (selectedIndex !== -1) {
            let selectedLink = resItems[selectedIndex]
              .getElementsByClassName("search-result-item-title")[0]
              .getAttribute("href");
            window.location.href = selectedLink;
          }
        }
      }
    };

    searchInput.forEach((el) => {
      el.addEventListener("keydown", handleKeyDown);
    });
    selectItem(-1);
  }
};

const displayResult = (curHitItems, queryStr, usedTime) => {
  const generateSearchResultHTML = (item, highlight) => {
    // pull template from hugo template definition
    let templateDefinition =
      searchResultItemTemplate != null
        ? searchResultItemTemplate.innerHTML
        : `
        <div class="search-result-item">
          #{ isset image }<div class="search-result-item-image">#{image}</div>#{ end }
          <div class="search-result-item-body">
            <a href="#{slug}" class="search-result-item-title">#{title}</a>
            #{ isset description }<p class="search-result-item-description">#{description}</p>#{ end }
            <p class="search-result-item-content">#{content}</p>
            <div class="search-result-item-taxonomies">
              #{ isset categories }<div><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16" style="margin-top:-2px"><path d="M11 0H3a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2 2 2 0 0 0 2-2V4a2 2 0 0 0-2-2 2 2 0 0 0-2-2zm2 3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1V3zM2 2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2z"/></svg>#{categories}</div>#{ end }
              
              #{ isset tags }<div><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16"><path d="M3 2v4.586l7 7L14.586 9l-7-7H3zM2 2a1 1 0 0 1 1-1h4.586a1 1 0 0 1 .707.293l7 7a1 1 0 0 1 0 1.414l-4.586 4.586a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 2 6.586V2z"/><path d="M5.5 5a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm0 1a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM1 7.086a1 1 0 0 0 .293.707L8.75 15.25l-.043.043a1 1 0 0 1-1.414 0l-7-7A1 1 0 0 1 0 7.586V3a1 1 0 0 1 1-1v5.086z"/></svg>#{tags}</div>#{ end }
            </div>
          </div>
        </div>`;

    // const renderedItems = filteredItems
    const renderedItem =
        renderResult(templateDefinition, {
          slug: item.slug,
          date: item.date,
          title: item.title,
          image: image == "true" ? item.image : "",
          tags: tags == "true" ? item.tags : "nomatch",
          categories: categories == "true"? item.categories : "nomatch",
          description:description == "true"? item.description: "",
          content: item.highlight.content ? item.highlight.content: item.content,
        });

        return `${renderedItem}`;
  };

  const filteredItemsLength = curHitItems.length;

  // Render Result into HTML
  const htmlString = curHitItems.map(generateSearchResultHTML).join("");
  searchResult.forEach((el) => {
    el.innerHTML = htmlString;
  });

  // count total-result and time
  let totalResults = `<em>${filteredItemsLength}</em> results`;
  let totalTime = ((usedTime) / 1000).toFixed(3);
  totalTime = `- in <em>${totalTime}</em> seconds`;

  searchResultInfo &&
    (searchResultInfo.innerHTML =
      filteredItemsLength > 0 ? `${totalResults} ${totalTime}` : "");

  // hide search-result-group-title if un-available result
  const groupTitle = document.querySelectorAll(".search-result-group-title");
  groupTitle.forEach((el) => {
    // hide search-result-group-title if there is no result
    if (el.nextElementSibling === null) {
      el.style.display = "none";
    }
    // hide emptySearchResult if there is no result
    if (el.nextElementSibling != null) {
      emptySearchResult.forEach((el) => {
        el.style.display = "";
      });
    } else {
      emptySearchResult.forEach((el) => {
        el.style.display = "block";
      });
    }
  });

  // hide tag/category if un-available result
  const searchInfo = document.querySelectorAll(".search-info > div");
  if (searchInfo.length > 0) {
    // hide tag/category if there is no result
    searchInfo.forEach((el) => {
      if (el.innerText.includes("nomatch") || el.innerText == "") {
        el.classList.add("hidden");
      }
    });
  }
};

const init = () => {
  searchWrapper = document.querySelector(".search-wrapper");
  searchModal = document.querySelector(".search-modal");
  searchFooter = document.querySelector(".search-wrapper-footer");
  searchResult = document.querySelectorAll("[data-search-result]");
  searchResultItemTemplate = document.getElementById("search-result-item-template");
  hasSearchWrapper = searchWrapper != null;
  hasSearchModal = searchModal != null;
  searchInput = document.querySelectorAll("[data-search-input]");
  emptySearchResult = document.querySelectorAll(".search-result-empty");
  openSearchModal = document.querySelectorAll('[data-target="search-modal"]');
  closeSearchModal = document.querySelectorAll('[data-target="close-search-modal"]');
  searchIcon = document.querySelector(".search-wrapper-header label svg[data-type='search']");
  searchIconReset = document.querySelector(".search-wrapper-header label svg[data-type='reset']");
  searchResultInfo = document.querySelector(".search-result-info");

  if (hasSearchWrapper) {
    // disable enter key on searchInput
    searchInput.forEach((el) => {
      el.addEventListener("keypress", (e) => {
        // enter to search
        if (e.keyCode == 13) {
          e.preventDefault();
          // let queryStr = el.value.toLowerCase();
          // if (queryStr.length > 1) {
          //   doSearch(queryStr);
          // }
        }
      });
    });

    // options
    image = searchWrapper.getAttribute("data-image");
    description = searchWrapper.getAttribute("data-description");
    tags = searchWrapper.getAttribute("data-tags");
    categories = searchWrapper.getAttribute("data-categories");

    let searchString = "";

    // get search string from url
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchString = urlParams.get("s")
      ? encodeURIComponent(urlParams.get("s"))
      : null;

    if (urlSearchString !== null) {
      searchString = urlSearchString.replace(/\+/g, " ");
      searchInput.forEach((el) => {
        el.value = searchString;
      });
      searchIcon && (searchIcon.style.display = "none");
      searchIconReset && (searchIconReset.style.display = "initial");
    }

    searchInput.forEach((el) => {
      el.addEventListener("input", (e) => {
        searchString = e.target.value.toLowerCase();
        window.history.replaceState(
          {},
          "",
          `${window.location.origin}${
            window.location.pathname
          }?s=${searchString.replace(/ /g, "+")}`
        );

        if (searchString.length < 2) {
          return;
        }

        doSearch(searchString);
      });
    });

    if (searchModalVisible) {
      showModal();
    }

    // Trigger Reset Search
    searchIconReset &&
      searchIconReset.addEventListener("click", () => {
        resetSearch();
      });

    // Open Search Modal with click
    openSearchModal.forEach((el) => {
      el.addEventListener("click", function () {
        showModal();
      });
    });

    // Close Search Modal with click
    closeSearchModal.forEach((el) => {
      el.addEventListener("click", function () {
        closeModal();
      });
    });

    // Close modal on click outside modal-body
    searchWrapper.addEventListener("click", function (e) {
      if (e.target.classList.contains("search-wrapper")) {
        closeModal();
      }
    });

  }
};

document.addEventListener("keydown", (e) => {
  toggleSearchModalWithK(e);
  closeSearchModalWithESC(e);
});

// Render Result Template
const renderResult = (templateString, data) => {
  var conditionalMatches, conditionalPattern, copy;
  conditionalPattern = /\#\{\s*isset ([a-zA-Z]*) \s*\}(.*)\#\{\s*end\s*}/g;
  // since loop below depends on re.lastIndex, we use a copy to capture any manipulations whilst inside the loop
  copy = templateString;
  while (
    (conditionalMatches = conditionalPattern.exec(templateString)) !== null
  ) {
    if (data[conditionalMatches[1]]) {
      // if valid key, remove conditionals, leave contents.
      copy = copy.replace(conditionalMatches[0], conditionalMatches[2]);
    } else {
      // if not valid, remove entire section
      copy = copy.replace(conditionalMatches[0], "");
    }
  }
  templateString = copy;
  //now any conditionals removed we can do simple substitution
  var key, find, re;
  for (key in data) {
    find = "\\#\\{\\s*" + key + "\\s*\\}";
    re = new RegExp(find, "g");
    templateString = templateString.replace(re, data[key]);
  }
  return templateString;
};

// ========================================================================================

// Reset Search
const resetSearch = () => {
  searchIcon && (searchIcon.style.display = "initial");
  searchIconReset && (searchIconReset.style.display = "none");
  searchInput.forEach((el) => {
    el.value = "";
  });
  searchResult.forEach((el) => {
    el.innerHTML = "";
  });
  emptySearchResult.forEach((el) => {
    el.style.display = "";
    el.innerHTML = search_initial_message;
  });
  searchResultInfo.innerHTML = "";

  // clear search query string from URL
  if (window.location.search.includes("?s=")) {
    window.history.pushState(
      "",
      document.title,
      window.location.pathname + window.location.hash
    );
  }
};

// Body Scroll
const enableBodyScroll = () => {
  setTimeout(() => {
    document.body.style.overflowY = "";
    document.body.style.paddingRight = "";
  }, 200);
};

const disableBodyScroll = () => {
  const documentWidth = document.documentElement.clientWidth;
  const scrollbarWidth = Math.abs(window.innerWidth - documentWidth);
  document.body.style.overflowY = "hidden";
  document.body.style.paddingRight = scrollbarWidth + "px";
};

// Show/Hide Search Modal
const showModal = () => {
  searchModal.classList.add("show");
  window.setTimeout(
    () => document.querySelector("[data-search-input]").focus(),
    100
  );
  if (hasSearchModal) {
    disableBodyScroll();
    searchModalVisible = true;
  }
};

const closeModal = () => {
  searchModal.classList.remove("show");
  resetSearch();
  if (hasSearchModal) {
    enableBodyScroll();
    searchModalVisible = false;
  }
};


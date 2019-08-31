(function() {
    var mdHtml, mdSrc, permalink, scrollMap;
    var defaults = {
        html: true,
        xhtmlOut: true,
        breaks: true,
        langPrefix: 'language-',
        linkify: true,
        linkTarget: '',
        typographer: true,
        _highlight: true,
        _strict: false,
        _view: 'html'
    };
    defaults.highlight = function(str, lang) {
        if (!defaults._highlight || !window.hljs) { return ''; }
        var hljs = window.hljs;
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(lang, str).value;
            } catch (__) {}
        }

        try {
            return hljs.highlightAuto(str).value;
        } catch (__) {}

        return '';
    };

    function setResultView(name) {
        $('body').removeClass('result-as_html');
        $('body').removeClass('result-as_src');
        $('body').removeClass('result-as_debug');
        $('body').addClass('result-as-' + name);
        defaults._view = name;
    }

    function mdInit() {
        if (defaults._strict) {
            mdHtml = new window.Remarkable('commonmark');
            mdSrc = new window.Remarkable('commonmark');
        } else {
            mdHtml = new window.Remarkable('full', defaults);
            mdSrc = new window.Remarkable('full', defaults);
        }
        mdHtml.renderer.rules.table_open = function() {
            return '<table class="table table-striped">\n';
        };
        mdHtml.renderer.rules.paragraph_open = function(tokens, idx) {
            var line;
            if (tokens[idx].lines && tokens[idx].level === 0) {
                line = tokens[idx].lines[0];
                return '<p class="line" data-line="' + line + '">';
            }
            return '<p>';
        };

        mdHtml.renderer.rules.heading_open = function(tokens, idx) {
            var line;
            if (tokens[idx].lines && tokens[idx].level === 0) {
                line = tokens[idx].lines[0];
                return '<h' + tokens[idx].hLevel + ' class="line" data-line="' + line + '">';
            }
            return '<h' + tokens[idx].hLevel + '>';
        };
    };

    function setHighlightedlContent(selector, content, lang) {
        if (window.hljs) {
            $(selector).html(window.hljs.highlight(lang, content).value);
        } else {
            $(selector).text(content);
        }
    };

    function updateResult() {
        var source = $('.source').val();

        // Update only active view to avoid slowdowns
        // (debug & src view with highlighting are a bit slow)
        if (defaults._view === 'src') {
            setHighlightedlContent('.result-src-content', mdSrc.render(source), 'html');

        } else if (defaults._view === 'debug') {
            setHighlightedlContent(
                '.result-debug-content',
                JSON.stringify(mdSrc.parse(source, { references: {} }), null, 2),
                'json'
            );

        } else { /*defaults._view === 'html'*/
            $('.result-html').html(mdHtml.render(source));
        }
        scrollMap = null;

        try {
            if (source) {
                permalink.href = '#md64=' + window.btoa(encodeURI(JSON.stringify({
                    source: source,
                    defaults: _.omit(defaults, 'highlight')
                })));
            } else {
                permalink.href = '';
            }
        } catch (__) {
            permalink.href = '';
        }
    };

    function buildScrollMap() {
        var i, offset, nonEmptyList, pos, a, b, lineHeightMap, linesCount,
            acc, sourceLikeDiv, textarea = $('.source'),
            _scrollMap;

        sourceLikeDiv = $('<div />').css({
            position: 'absolute',
            visibility: 'hidden',
            height: 'auto',
            width: textarea[0].clientWidth,
            'font-size': textarea.css('font-size'),
            'font-family': textarea.css('font-family'),
            'line-height': textarea.css('line-height'),
            'white-space': textarea.css('white-space')
        }).appendTo('body');

        offset = $('.result-html').scrollTop() - $('.result-html').offset().top;
        _scrollMap = [];
        nonEmptyList = [];
        lineHeightMap = [];

        acc = 0;
        textarea.val().split('\n').forEach(function(str) {
            var h, lh;

            lineHeightMap.push(acc);

            if (str.length === 0) {
                acc++;
                return;
            }

            sourceLikeDiv.text(str);
            h = parseFloat(sourceLikeDiv.css('height'));
            lh = parseFloat(sourceLikeDiv.css('line-height'));
            acc += Math.round(h / lh);
        });
        sourceLikeDiv.remove();
        lineHeightMap.push(acc);
        linesCount = acc;

        for (i = 0; i < linesCount; i++) { _scrollMap.push(-1); }

        nonEmptyList.push(0);
        _scrollMap[0] = 0;

        $('.line').each(function(n, el) {
            var $el = $(el),
                t = $el.data('line');
            if (t === '') { return; }
            t = lineHeightMap[t];
            if (t !== 0) { nonEmptyList.push(t); }
            _scrollMap[t] = Math.round($el.offset().top + offset);
        });

        nonEmptyList.push(linesCount);
        _scrollMap[linesCount] = $('.result-html')[0].scrollHeight;

        pos = 0;
        for (i = 1; i < linesCount; i++) {
            if (_scrollMap[i] !== -1) {
                pos++;
                continue;
            }

            a = nonEmptyList[pos];
            b = nonEmptyList[pos + 1];
            _scrollMap[i] = Math.round((_scrollMap[b] * (i - a) + _scrollMap[a] * (b - i)) / (b - a));
        }

        return _scrollMap;
    }

    function syncScroll() {
        var textarea = $('.source'),
            lineHeight = parseFloat(textarea.css('line-height')),
            lineNo, posTo;

        lineNo = Math.floor(textarea.scrollTop() / lineHeight);
        if (!scrollMap) { scrollMap = buildScrollMap(); }
        posTo = scrollMap[lineNo];
        $('.result-html').stop(true).animate({
            scrollTop: posTo
        }, 100, 'linear');
    }
    // Init on page load
    //
    $(function() {

        // Restore content if opened by permalink
        if (location.hash && /^(#md=|#md64=)/.test(location.hash)) {
            try {
                var cfg;

                if (/^#md64=/.test(location.hash)) {
                    cfg = JSON.parse(decodeURI(window.atob(location.hash.slice(6))));
                } else {
                    // Legacy mode for old links. Those become broken in github posts,
                    // so we switched to base64 encoding.
                    cfg = JSON.parse(decodeURIComponent(location.hash.slice(4)));
                }

                if (_.isString(cfg.source)) {
                    $('.source').val(cfg.source);
                }

                var opts = _.isObject(cfg.defaults) ? cfg.defaults : {};

                // copy config to defaults, but only if key exists
                // and value has the same type
                _.forOwn(opts, function(val, key) {
                    if (!_.has(defaults, key)) { return; }

                    // Legacy, for old links
                    if (key === '_src') {
                        defaults._view = val ? 'src' : 'html';
                        return;
                    }

                    if ((_.isBoolean(defaults[key]) && _.isBoolean(val)) ||
                        (_.isString(defaults[key]) && _.isString(val))) {
                        defaults[key] = val;
                    }
                });

                // sanitize for sure
                if (['html', 'src', 'debug'].indexOf(defaults._view) === -1) {
                    defaults._view = 'html';
                }
            } catch (__) {}
        }

        // Activate tooltips
        $('._tip').tooltip({ container: 'body' });

        // Set default option values and option listeners
        _.forOwn(defaults, function(val, key) {
            if (key === 'highlight') { return; }

            var el = document.getElementById(key);

            if (!el) { return; }

            var $el = $(el);

            if (_.isBoolean(val)) {
                $el.prop('checked', val);
                $el.on('change', function() {
                    var value = Boolean($el.prop('checked'));
                    setOptionClass(key, value);
                    defaults[key] = value;
                    mdInit();
                    updateResult();
                });
                setOptionClass(key, val);

            } else {
                $(el).val(val);
                $el.on('change update keyup', function() {
                    defaults[key] = String($(el).val());
                    mdInit();
                    updateResult();
                });
            }
        });

        setResultView(defaults._view);

        mdInit();
        permalink = document.getElementById('permalink');

        // Setup listeners
        $('.source').on('keyup paste cut mouseup', _.debounce(updateResult, 300, { maxWait: 500 }));
        $('.source').on('scroll', _.debounce(syncScroll, 50, { maxWait: 50 }));

        $('.source-clear').on('click', function(event) {
            $('.source').val('');
            updateResult();
            event.preventDefault();
        });

        $(document).on('click', '[data-result-as]', function(event) {
            var view = $(this).data('resultAs');
            if (view) {
                setResultView(view);
                // only to update permalink
                updateResult();
                event.preventDefault();
            }
        });

        // Need to recalculate line positions on window resize
        $(window).on('resize', function() {
            scrollMap = null;
        });

        updateResult();
    });
})();


//File chooser
function chooseImage(event) {
    var input = $(document.getElementById("image-filechooser"));
    input.attr("type", "file");
    input.attr("accept", "image/png, image/jpeg,image/jpg");
    input.trigger("click");
};

function changeInput() {
    console.log($(document.getElementById("image-filechooser")).val());
    var valueTextArea = $(document.getElementsByClassName("source")).val();
    var valueImage = $(document.getElementById("image-filechooser")).val();
    $(document.getElementsByClassName("source")).val(valueTextArea + "![alt text](" + valueImage + ")");
}
// help markdown
function helpMarkdown() {
    $("#markdown-content")[0].style.display = "table";
}

function endHelp() {
    $("#markdown-content")[0].style.display = "none";
}

function suggestTags() {
    $(".suggest-tags")[0].style.display = "block";
}

$(document).on('click', '.tags-item', function() {
    createTag(this.innerHTML.substr(26) + " ", 12);
    $(".suggest-tags")[0].style.display = "none";
});

function createTag(s, count) {
    var x = document.createElement("li");
    x.classList.add("token-input-token");
    var y = document.createElement("p");
    var z = document.createElement("span");
    z.classList.add("count");
    z.innerHTML = count;
    y.innerHTML = s;
    y.appendChild(z);
    z = document.createElement("span");
    z.classList.add("token-input-delete-token");
    z.innerHTML = "×";
    x.appendChild(y);
    x.appendChild(z);
    var last = document.getElementById('tag-input');
    last.value = "";
    $(".token-input-list")[0].insertBefore(x, last);
    $(".suggest-tags")[0].style.display = "none";
}
$(document).on('click', '.token-input-delete-token', function() {
    this.parentNode.parentNode.removeChild(this.parentNode);
});
$(document).on('click', '.editor-only', function() {
    $('.col-xs-6.left.full-height').css('width', "100%");
    $('.col-xs-6.left.full-height').css("display", "inline-block");
    $('.col-xs-6.right.full-height').css("display", "none");
    $('.editor-only').css('color', '#a1cf64');
    $('.editor-preview').css('color', '#808080');
    $('.preview-only').css('color', '#808080');
});
$(document).on('click', '.editor-preview', function() {
    $('.col-xs-6.left.full-height').css('width', "49.5%");
    $('.col-xs-6.right.full-height').css('width', "49.5%");
    $('.col-xs-6.left.full-height').css("display", "inline-block");
    $('.col-xs-6.right.full-height').css("display", "inline-block");
    $('.editor-only').css('color', '#808080');
    $('.editor-preview').css('color', '#a1cf64');
    $('.preview-only').css('color', '#808080');
});
$(document).on('click', '.preview-only', function() {
    $('.col-xs-6.right.full-height').css('width', "100%");
    $('.col-xs-6.left.full-height').css("display", "none");
    $('.col-xs-6.right.full-height').css("display", "inline-block");
    $('.editor-only').css('color', '#808080');
    $('.editor-preview').css('color', '#808080');
    $('.preview-only').css('color', '#a1cf64');
});
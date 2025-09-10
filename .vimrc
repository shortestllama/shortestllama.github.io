augroup JekyllAutoRename
  autocmd!
  " Trigger only when creating a brand-new file under _posts/
  autocmd BufNewFile _posts/*.md call JekyllRenameAndInit()
augroup END

function! JekyllRenameAndInit() abort
  let oldpath = expand('%:p')
  let fname   = expand('%:t')

  " If it already has a YYYY-MM-DD- prefix, do nothing
  if fname =~# '^\d\{4}-\d\{2}-\d\{2}-'
    " Optionally, insert front matter if empty new buffer
    if line('$') == 1 && getline(1) == ''
      call s:InsertFrontMatter(s:TitleFromSlug(fname))
    endif
    return
  endif

  " Build date+slug
  let date = strftime('%Y-%m-%d')
  let title = substitute(fname, '\.md$', '', '')
  let slug = tolower(title)
  let slug = substitute(slug, '[^a-z0-9]\+', '-', 'g')
  let slug = substitute(slug, '^-*\|-*$','','g')

  let newpath = expand('%:p:h') . '/' . date . '-' . slug . '.md'

  " If this is an empty new buffer, insert front matter before saving
  if line('$') == 1 && getline(1) == ''
    call s:InsertFrontMatter(s:TitleFromSlug(slug))
  endif

  " Save as new name, then remove the old empty file if it got created
  execute 'silent keepalt saveas ' . fnameescape(newpath)
  if filereadable(oldpath) && oldpath !=# newpath
    call delete(oldpath)
  endif
endfunction

function! s:TitleFromSlug(s) abort
  " turn 'osed-review' or '2025-09-09-osed-review.md' into 'Osed Review'
  let base = substitute(a:s, '^\d\{4}-\d\{2}-\d\{2}-', '', '')
  let base = substitute(base, '\.md$', '', '')
  let words = split(substitute(base, '-', ' ', 'g'))
  return join(map(words, 'toupper(strpart(v:val,0,1)).strpart(v:val,1)'), ' ')
endfunction

function! s:InsertFrontMatter(title) abort
  let date = strftime('%Y-%m-%d')
  call setline(1, [
        \ '---',
        \ 'layout: post',
        \ 'title: "' . a:title . '"',
        \ 'date: ' . date,
        \ '---',
        \ ''
        \ ])
  " Leave cursor below front matter
  normal! G
endfunction
